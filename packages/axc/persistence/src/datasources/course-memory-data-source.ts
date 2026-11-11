import {
	Course,
	type CourseModality,
	type CourseRepository,
	type CourseStatus,
	courseModalities,
	courseStatuses,
	EnrollmentRequest,
	type EnrollmentRequestProps,
	type EnrollmentRequestRepository,
	type EnrollmentRequestStatus,
	type EnrollmentRequestUnitOfWork,
	enrollmentRequestStatuses,
	type StatusHistoryEntry,
	systemCatalogPassport,
} from '@axc/domain';
import { createMemoryMongoServer } from '@axc/service-mongoose';
import { NotFoundError } from '@cellix/domain-seedwork/repository';
import mongoose from 'mongoose';
import { courseSeed } from './course.seed.ts';

interface CourseDocument {
	_id: string;
	title: string;
	summary: string;
	modality: string;
	status: string;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

const courseSchema = new mongoose.Schema<CourseDocument>(
	{
		_id: { type: String, required: true },
		title: { type: String, required: true },
		summary: { type: String, required: true },
		modality: { type: String, required: true },
		status: { type: String, required: true },
		tags: { type: [String], required: true },
		createdAt: { type: String, required: true },
		updatedAt: { type: String, required: true },
	},
	{ collection: 'courses', versionKey: false },
);

export interface DataSources {
	readonlyDataSource: {
		course: CourseRepository;
		enrollmentRequest: EnrollmentRequestRepository;
	};
	domainDataSource: {
		enrollmentRequest: EnrollmentRequestUnitOfWork;
	};
}

let ready: Promise<mongoose.Model<CourseDocument>> | undefined;

function isModality(value: string): value is CourseModality {
	return courseModalities.some((item) => item === value);
}

function isStatus(value: string): value is CourseStatus {
	return courseStatuses.some((item) => item === value);
}

function courseModel(): Promise<mongoose.Model<CourseDocument>> {
	ready ??= (async () => {
		const memory = createMemoryMongoServer();
		await memory.start();
		await mongoose.connect(memory.getUri());
		// biome-ignore lint/complexity/useLiteralKeys: index signature
		const model = mongoose.models['CourseCatalog'] ?? mongoose.model<CourseDocument>('CourseCatalog', courseSchema);
		const count = await model.countDocuments();
		if (count === 0) {
			await model.insertMany(
				courseSeed.map((course) => ({
					_id: course.id,
					title: course.title,
					summary: course.summary,
					modality: course.modality,
					status: course.status,
					tags: [...course.tags],
					createdAt: course.createdAt,
					updatedAt: course.updatedAt,
				})),
			);
		}
		return model;
	})();
	return ready;
}

class MemoryCourseRepository implements CourseRepository {
	public async get(id: string): Promise<Course> {
		const courses = await this.list();
		const found = courses.find((course) => course.id === id);
		if (found === undefined) {
			return Promise.reject(new NotFoundError(`Course ${id} was not found.`));
		}
		return found;
	}

	public async save(item: Course): Promise<Course> {
		await Promise.resolve();
		return item;
	}

	public async list(): Promise<readonly Course[]> {
		const model = await courseModel();
		const documents = await model.find().lean<CourseDocument[]>();
		return documents.map((document) => {
			if (!isModality(document.modality) || !isStatus(document.status)) {
				throw new Error(`Course ${document._id} has an invalid catalog value.`);
			}
			return Course.getNewInstance(
				{
					id: document._id,
					title: document.title,
					summary: document.summary,
					modality: document.modality,
					status: document.status,
					tags: document.tags,
					createdAt: document.createdAt,
					updatedAt: document.updatedAt,
				},
				systemCatalogPassport,
			);
		});
	}
}

interface StatusHistoryDocument {
	fromStatus?: string | null;
	toStatus: string;
	changedAt: string;
	changedBy: string;
	reason?: string | null;
}

interface EnrollmentDocument {
	_id: string;
	courseId: string;
	learnerEmail: string;
	justification: string;
	status: string;
	createdAt: string;
	updatedAt: string;
	statusHistory: StatusHistoryDocument[];
}

const enrollmentSchema = new mongoose.Schema<EnrollmentDocument>(
	{
		_id: { type: String, required: true },
		courseId: { type: String, required: true },
		learnerEmail: { type: String, required: true },
		justification: { type: String, required: true },
		status: { type: String, required: true },
		createdAt: { type: String, required: true },
		updatedAt: { type: String, required: true },
		statusHistory: {
			type: [
				{
					fromStatus: { type: String, default: null },
					toStatus: { type: String, required: true },
					changedAt: { type: String, required: true },
					changedBy: { type: String, required: true },
					reason: { type: String, default: null },
				},
			],
			required: true,
		},
	},
	{ collection: 'enrollmentRequests', versionKey: false },
);

let enrollmentReady: Promise<mongoose.Model<EnrollmentDocument>> | undefined;

function isEnrollmentStatus(value: string): value is EnrollmentRequestStatus {
	return enrollmentRequestStatuses.some((item) => item === value);
}

function historyEntry(entry: StatusHistoryDocument): StatusHistoryEntry {
	if (!isEnrollmentStatus(entry.toStatus)) {
		throw new Error('Enrollment request history has an invalid status.');
	}
	const fromStatus = entry.fromStatus ?? null;
	if (fromStatus !== null && !isEnrollmentStatus(fromStatus)) {
		throw new Error('Enrollment request history has an invalid status.');
	}
	return {
		fromStatus,
		toStatus: entry.toStatus,
		changedAt: entry.changedAt,
		changedBy: entry.changedBy,
		reason: entry.reason ?? null,
	};
}

function toEnrollment(document: EnrollmentDocument): EnrollmentRequest {
	if (!isEnrollmentStatus(document.status)) {
		throw new Error(`Enrollment request ${document._id} has an invalid status.`);
	}
	const props: EnrollmentRequestProps = {
		id: document._id,
		courseId: document.courseId,
		learnerEmail: document.learnerEmail,
		justification: document.justification,
		status: document.status,
		createdAt: document.createdAt,
		updatedAt: document.updatedAt,
		statusHistory: document.statusHistory.map((entry) => historyEntry(entry)),
	};
	return EnrollmentRequest.getNewInstance(props, systemCatalogPassport);
}

function enrollmentModel(): Promise<mongoose.Model<EnrollmentDocument>> {
	enrollmentReady ??= (async () => {
		await courseModel();
		// biome-ignore lint/complexity/useLiteralKeys: index signature
		return mongoose.models['EnrollmentRequestCatalog'] ?? mongoose.model<EnrollmentDocument>('EnrollmentRequestCatalog', enrollmentSchema);
	})();
	return enrollmentReady;
}

class MemoryEnrollmentRequestRepository implements EnrollmentRequestRepository {
	public async get(id: string): Promise<EnrollmentRequest> {
		const model = await enrollmentModel();
		const document = await model.findById(id).lean<EnrollmentDocument | null>();
		if (document === null) {
			throw new NotFoundError(`Enrollment request ${id} was not found.`);
		}
		return toEnrollment(document);
	}

	public async save(item: EnrollmentRequest): Promise<EnrollmentRequest> {
		const model = await enrollmentModel();
		await model.replaceOne(
			{ _id: item.id },
			{
				courseId: item.props.courseId,
				learnerEmail: item.props.learnerEmail,
				justification: item.props.justification,
				status: item.props.status,
				createdAt: item.props.createdAt,
				updatedAt: item.props.updatedAt,
				statusHistory: item.props.statusHistory.map((entry) => ({
					fromStatus: entry.fromStatus,
					toStatus: entry.toStatus,
					changedAt: entry.changedAt,
					changedBy: entry.changedBy,
					reason: entry.reason,
				})),
			},
			{ upsert: true },
		);
		return item;
	}

	public async list(): Promise<readonly EnrollmentRequest[]> {
		const model = await enrollmentModel();
		const documents = await model.find().lean<EnrollmentDocument[]>();
		return documents.map((document) => toEnrollment(document));
	}
}

class MemoryEnrollmentRequestUnitOfWork implements EnrollmentRequestUnitOfWork {
	private readonly repository: MemoryEnrollmentRequestRepository;
	public constructor(repository: MemoryEnrollmentRequestRepository) {
		this.repository = repository;
	}

	public async withTransaction(_passport: typeof systemCatalogPassport, func: (repository: EnrollmentRequestRepository) => Promise<void>): Promise<void> {
		await func(this.repository);
	}

	public async withScopedTransaction(func: (repository: EnrollmentRequestRepository) => Promise<void>): Promise<void> {
		await func(this.repository);
	}

	public async withScopedTransactionById(id: string, func: (repository: EnrollmentRequestRepository) => Promise<void>): Promise<EnrollmentRequest> {
		await func(this.repository);
		return this.repository.get(id);
	}
}

let repository: MemoryCourseRepository | undefined;
let enrollmentRepository: MemoryEnrollmentRequestRepository | undefined;
let enrollmentUnitOfWork: MemoryEnrollmentRequestUnitOfWork | undefined;

export function getDataSources(): DataSources {
	repository ??= new MemoryCourseRepository();
	enrollmentRepository ??= new MemoryEnrollmentRequestRepository();
	enrollmentUnitOfWork ??= new MemoryEnrollmentRequestUnitOfWork(enrollmentRepository);
	return {
		readonlyDataSource: {
			course: repository,
			enrollmentRequest: enrollmentRepository,
		},
		domainDataSource: {
			enrollmentRequest: enrollmentUnitOfWork,
		},
	};
}
