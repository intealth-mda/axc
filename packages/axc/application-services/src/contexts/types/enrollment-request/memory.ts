import { EnrollmentRequest, type EnrollmentRequestProps, isActiveEnrollmentRequestStatus, type Passport } from '@axc/domain';
import { EnrollmentRequestFailure } from './errors.ts';

export type EnrollmentRequestAggregate = EnrollmentRequest<EnrollmentRequestProps>;

export interface EnrollmentRequestWriteRepository {
	getById(id: string): Promise<EnrollmentRequestAggregate>;
	getNewInstance(courseId: string, learnerEmail: string, justification: string, status: string): Promise<EnrollmentRequestAggregate>;
	save(item: EnrollmentRequestAggregate): Promise<EnrollmentRequestAggregate>;
	hasActiveRequest(courseId: string, learnerEmail: string): Promise<boolean>;
}

export interface EnrollmentRequestMemoryReadRepository {
	getAll(): Promise<EnrollmentRequestAggregate[]>;
	getById(id: string): Promise<EnrollmentRequestAggregate | null>;
}

export interface EnrollmentRequestMemoryUnitOfWork {
	withScopedTransaction(work: (repository: EnrollmentRequestWriteRepository) => Promise<void>): Promise<void>;
}

class EnrollmentRequestStore {
	private sequence = 1;
	private readonly ids: string[] = [];
	private readonly byId = new Map<string, EnrollmentRequestAggregate>();
	private readonly passport: Passport;

	constructor(passport: Passport) {
		this.passport = passport;
	}

	list(): EnrollmentRequestAggregate[] {
		return this.ids.flatMap((id) => {
			const request = this.byId.get(id);
			return request === undefined ? [] : [request];
		});
	}

	find(id: string): EnrollmentRequestAggregate | null {
		return this.byId.get(id) ?? null;
	}

	require(id: string): EnrollmentRequestAggregate {
		const request = this.find(id);
		if (!request) {
			throw new EnrollmentRequestFailure(404, 'ENROLLMENT_REQUEST_NOT_FOUND', 'Enrollment request not found.', [{ field: 'id', message: 'Enrollment request not found.' }]);
		}
		return request;
	}

	hasActiveRequest(courseId: string, learnerEmail: string): boolean {
		const email = learnerEmail.toLowerCase();
		return this.list().some((request) => request.courseId === courseId && request.learnerEmail.toLowerCase() === email && isActiveEnrollmentRequestStatus(request.status));
	}

	create(courseId: string, learnerEmail: string, justification: string, status: string): EnrollmentRequestAggregate {
		const id = `enroll-${String(this.sequence).padStart(3, '0')}`;
		this.sequence += 1;
		const now = new Date();
		const props: EnrollmentRequestProps = {
			id,
			courseId,
			learnerEmail,
			justification,
			status,
			statusHistory: [],
			createdAt: now,
			updatedAt: now,
			schemaVersion: '1.0.0',
		};
		return EnrollmentRequest.getNewInstance(props, courseId, learnerEmail, justification, status, this.passport);
	}

	save(item: EnrollmentRequestAggregate): EnrollmentRequestAggregate {
		if (!this.byId.has(item.id)) {
			this.ids.push(item.id);
		}
		this.byId.set(item.id, item);
		return item;
	}
}

export function createEnrollmentRequestMemory(passport: Passport): { readRepository: EnrollmentRequestMemoryReadRepository; unitOfWork: EnrollmentRequestMemoryUnitOfWork } {
	const store = new EnrollmentRequestStore(passport);
	const repository: EnrollmentRequestWriteRepository = {
		getById(id: string): Promise<EnrollmentRequestAggregate> {
			return Promise.resolve(store.require(id));
		},
		getNewInstance(courseId: string, learnerEmail: string, justification: string, status: string): Promise<EnrollmentRequestAggregate> {
			return Promise.resolve(store.create(courseId, learnerEmail, justification, status));
		},
		save(item: EnrollmentRequestAggregate): Promise<EnrollmentRequestAggregate> {
			return Promise.resolve(store.save(item));
		},
		hasActiveRequest(courseId: string, learnerEmail: string): Promise<boolean> {
			return Promise.resolve(store.hasActiveRequest(courseId, learnerEmail));
		},
	};
	return {
		readRepository: {
			getAll(): Promise<EnrollmentRequestAggregate[]> {
				return Promise.resolve(store.list());
			},
			getById(id: string): Promise<EnrollmentRequestAggregate | null> {
				return Promise.resolve(store.find(id));
			},
		},
		unitOfWork: {
			withScopedTransaction(work: (repo: EnrollmentRequestWriteRepository) => Promise<void>): Promise<void> {
				return work(repository);
			},
		},
	};
}
