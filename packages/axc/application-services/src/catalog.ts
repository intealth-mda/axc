import { type CourseRepository, changeEnrollmentStatus, createEnrollmentRequest, type EnrollmentRequestRepository, getEnrollmentRequest, listEnrollmentRequests, type RawQuery, searchCourses } from '@axc/domain';

export interface ApplicationCatalog {
	courses: CourseRepository;
	enrollmentRequests: EnrollmentRequestRepository;
	now?: () => string;
	newId?: () => string;
}

export function createCatalogServices(catalog: ApplicationCatalog | undefined) {
	const fallbackIds = createIdSequence();
	// shortcut: enrollment writes share one in-process queue, upgrade when more than one process handles requests
	let write = Promise.resolve();
	const exclusive = <T>(action: () => Promise<T>): Promise<T> => {
		const run = write.then(action, action);
		write = run.then(
			() => undefined,
			() => undefined,
		);
		return run;
	};
	const requireCatalog = (): ApplicationCatalog => {
		if (catalog === undefined) {
			throw new Error('Catalog dependencies are not configured');
		}
		return catalog;
	};

	return {
		courses: {
			async search(query: RawQuery) {
				return searchCourses(await requireCatalog().courses.list(), query);
			},
		},
		enrollmentRequests: {
			create(body: unknown) {
				return exclusive(async () => {
					const current = requireCatalog();
					const result = createEnrollmentRequest({
						courses: await current.courses.list(),
						requests: await current.enrollmentRequests.list(),
						body,
						id: current.newId ?? fallbackIds,
						now: current.now ?? defaultNow,
					});
					if (result.ok) {
						await current.enrollmentRequests.save(result.value);
					}
					return result;
				});
			},
			async getById(id: string) {
				return getEnrollmentRequest(await requireCatalog().enrollmentRequests.findById(id));
			},
			async list(query: RawQuery) {
				return listEnrollmentRequests(await requireCatalog().enrollmentRequests.list(), query);
			},
			updateStatus(id: string, body: unknown) {
				return exclusive(async () => {
					const current = requireCatalog();
					const result = changeEnrollmentStatus(await current.enrollmentRequests.findById(id), body, current.now ?? defaultNow);
					if (result.ok) {
						await current.enrollmentRequests.save(result.value);
					}
					return result;
				});
			},
		},
	};
}

function createIdSequence(): () => string {
	let next = 0;
	return () => {
		next += 1;
		return `enroll-${String(next).padStart(3, '0')}`;
	};
}

function defaultNow(): string {
	return new Date().toISOString();
}
