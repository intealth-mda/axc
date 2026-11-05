import type { ApplicationServicesFactory } from '@axc/application-services';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import { azureHonoHandler } from '@marplex/hono-azurefunc-adapter';
import { Hono } from 'hono';

export function createRestApp(applicationServicesFactory: ApplicationServicesFactory): Hono {
	const app = new Hono();

	app.get('/health', async (c) => {
		const authorization = c.req.header('Authorization');
		const applicationServices = authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
		return c.json(applicationServices.health.getStatus());
	});

	app.get('/api/courses', async (c) => {
		const authorization = c.req.header('Authorization');
		const applicationServices = authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
		const q = c.req.query('q');
		const modality = c.req.query('modality');
		const status = c.req.query('status');
		const tag = c.req.query('tag');
		const pageRaw = c.req.query('page');
		const pageSizeRaw = c.req.query('pageSize');
		const sort = c.req.query('sort');
		const modalities = ['online', 'in-person', 'hybrid'] as const;
		const statuses = ['draft', 'active', 'retired'] as const;
		const sorts = ['title', 'createdAt', 'updatedAt'] as const;
		const details: { field: string; message: string }[] = [];
		const isListed = (value: string, allowed: readonly string[]): boolean => allowed.includes(value);
		const isWholeNumber = (value: string): boolean => /^[1-9]\d*$/.test(value);
		if (modality !== undefined && !isListed(modality, modalities)) {
			details.push({ field: 'modality', message: 'modality must be online, in-person, or hybrid.' });
		}
		if (status !== undefined && !isListed(status, statuses)) {
			details.push({ field: 'status', message: 'status must be draft, active, or retired.' });
		}
		if (sort !== undefined && !isListed(sort, sorts)) {
			details.push({ field: 'sort', message: 'sort must be title, createdAt, or updatedAt.' });
		}
		if (pageRaw !== undefined && (!isWholeNumber(pageRaw) || Number(pageRaw) < 1)) {
			details.push({ field: 'page', message: 'page must be an integer greater than or equal to 1.' });
		}
		if (pageSizeRaw !== undefined && (!isWholeNumber(pageSizeRaw) || Number(pageSizeRaw) < 1 || Number(pageSizeRaw) > 50)) {
			details.push({ field: 'pageSize', message: 'pageSize must be between 1 and 50.' });
		}
		if (details.length > 0) {
			return c.json(
				{
					error: {
						code: 'INVALID_QUERY_PARAMETER',
						message: 'One or more query parameters are invalid.',
						details,
					},
				},
				400,
			);
		}
		const page = pageRaw === undefined ? 1 : Number(pageRaw);
		const pageSize = pageSizeRaw === undefined ? 10 : Number(pageSizeRaw);
		const modalityValue = modality === 'online' || modality === 'in-person' || modality === 'hybrid' ? modality : undefined;
		const statusValue = status === 'draft' || status === 'active' || status === 'retired' ? status : undefined;
		const sortValue = sort === 'title' || sort === 'createdAt' || sort === 'updatedAt' ? sort : 'title';
		try {
			const courses = await applicationServices.Catalog.Course.search({
				...(q === undefined ? {} : { q }),
				...(modalityValue === undefined ? {} : { modality: modalityValue }),
				...(statusValue === undefined ? {} : { status: statusValue }),
				...(tag === undefined ? {} : { tag }),
				page,
				pageSize,
				sort: sortValue,
			});
			const totalItems = courses.length;
			const start = (page - 1) * pageSize;
			const items = courses.slice(start, start + pageSize).map((course) => ({
				id: course.id,
				title: course.title,
				summary: course.summary,
				modality: course.modality,
				status: course.status,
				tags: course.tags,
				createdAt: course.createdAt.toISOString(),
				updatedAt: course.updatedAt.toISOString(),
			}));
			return c.json({
				items,
				page,
				pageSize,
				totalItems,
				totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize),
			});
		} catch (error) {
			let failure: unknown = error;
			for (let depth = 0; depth < 5 && typeof failure === 'object' && failure !== null && !('status' in failure); depth += 1) {
				failure = 'cause' in failure ? failure.cause : undefined;
			}
			const status = typeof failure === 'object' && failure !== null && 'status' in failure ? failure.status : undefined;
			const message = failure instanceof Error ? failure.message : error instanceof Error ? error.message : '';
			if (status === 400) return c.json({ message }, 400);
			if (status === 404) return c.json({ message }, 404);
			if (status === 409) return c.json({ message }, 409);
			throw error;
		}
	});
	const enrollmentStatuses = ['pending', 'approved', 'rejected', 'cancelled'] as const;
	type EnrollmentStatus = (typeof enrollmentStatuses)[number];
	const isEnrollmentStatus = (value: string): value is EnrollmentStatus => enrollmentStatuses.includes(value as EnrollmentStatus);
	const enrollmentError = (
		error: unknown,
	):
		| {
				status: 400 | 404 | 409;
				body: { error: { code: string; message: string; details: { field: string; message: string }[] } };
		  }
		| undefined => {
		let failure: unknown = error;
		for (let depth = 0; depth < 5 && typeof failure === 'object' && failure !== null && !('status' in failure); depth += 1) {
			failure = 'cause' in failure ? failure.cause : undefined;
		}
		const statusValue = typeof failure === 'object' && failure !== null && 'status' in failure ? failure.status : undefined;
		const status: 400 | 404 | 409 | undefined = statusValue === 400 ? 400 : statusValue === 404 ? 404 : statusValue === 409 ? 409 : undefined;
		if (status === undefined) {
			return undefined;
		}
		const code = typeof failure === 'object' && failure !== null && 'code' in failure && typeof failure.code === 'string' ? failure.code : 'INVALID_REQUEST';
		const field = typeof failure === 'object' && failure !== null && 'field' in failure && typeof failure.field === 'string' ? failure.field : 'request';
		const detail = failure instanceof Error ? failure.message : 'The request could not be completed.';
		return {
			status,
			body: {
				error: {
					code,
					message: 'The request could not be completed.',
					details: [{ field, message: detail }],
				},
			},
		};
	};
	const toEnrollment = (request: {
		id: string;
		courseId: string;
		learnerEmail: string;
		justification: string;
		status: EnrollmentStatus;
		createdAt: Date;
		updatedAt: Date;
		statusHistory: readonly { fromStatus: string | null; toStatus: string; changedAt: string; changedBy: string; reason: string | null }[];
	}) => ({
		id: request.id,
		courseId: request.courseId,
		learnerEmail: request.learnerEmail,
		justification: request.justification,
		status: request.status,
		createdAt: request.createdAt.toISOString(),
		updatedAt: request.updatedAt.toISOString(),
		statusHistory: request.statusHistory.map((entry) => ({
			fromStatus: entry.fromStatus,
			toStatus: entry.toStatus,
			changedAt: entry.changedAt,
			changedBy: entry.changedBy,
			reason: entry.reason,
		})),
	});
	app.post('/api/enrollment-requests', async (c) => {
		const authorization = c.req.header('Authorization');
		const applicationServices = authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
		try {
			const created = await applicationServices.Catalog.EnrollmentRequest.create(await c.req.json());
			return c.json(toEnrollment(created));
		} catch (error) {
			const failure = enrollmentError(error);
			if (failure) return c.json(failure.body, failure.status);
			throw error;
		}
	});
	app.get('/api/enrollment-requests', async (c) => {
		const authorization = c.req.header('Authorization');
		const applicationServices = authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
		const statusQuery = c.req.query('status');
		const courseId = c.req.query('courseId');
		const learnerEmail = c.req.query('learnerEmail');
		if (statusQuery !== undefined && !isEnrollmentStatus(statusQuery)) {
			return c.json(
				{
					error: {
						code: 'INVALID_REQUEST',
						message: 'The request could not be completed.',
						details: [{ field: 'status', message: 'status must be pending, approved, rejected, or cancelled.' }],
					},
				},
				400,
			);
		}
		try {
			const requests = await applicationServices.Catalog.EnrollmentRequest.find({
				...(statusQuery === undefined ? {} : { status: statusQuery }),
				...(courseId === undefined ? {} : { courseId }),
				...(learnerEmail === undefined ? {} : { learnerEmail }),
			});
			return c.json({ items: requests.map((request) => toEnrollment(request)) });
		} catch (error) {
			const failure = enrollmentError(error);
			if (failure) return c.json(failure.body, failure.status);
			throw error;
		}
	});
	app.get('/api/enrollment-requests/:id', async (c) => {
		const authorization = c.req.header('Authorization');
		const applicationServices = authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
		try {
			const requests = await applicationServices.Catalog.EnrollmentRequest.findById({ id: c.req.param('id') ?? '' });
			const request = requests[0];
			if (!request) {
				return c.json(
					{
						error: {
							code: 'ENROLLMENT_REQUEST_NOT_FOUND',
							message: 'The request could not be completed.',
							details: [{ field: 'id', message: 'Enrollment request does not exist.' }],
						},
					},
					404,
				);
			}
			return c.json(toEnrollment(request));
		} catch (error) {
			const failure = enrollmentError(error);
			if (failure) return c.json(failure.body, failure.status);
			throw error;
		}
	});
	app.patch('/api/enrollment-requests/:id/status', async (c) => {
		const authorization = c.req.header('Authorization');
		const applicationServices = authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
		const body: { status?: string; changedBy?: string; reason?: string } = await c.req.json();
		const details: { field: string; message: string }[] = [];
		if (body.status === undefined || !isEnrollmentStatus(body.status)) {
			details.push({ field: 'status', message: 'status must be pending, approved, rejected, or cancelled.' });
		}
		if (body.changedBy === undefined || body.changedBy.trim() === '') {
			details.push({ field: 'changedBy', message: 'changedBy is required.' });
		}
		if (body.status === 'rejected' && (body.reason === undefined || body.reason.trim() === '')) {
			details.push({ field: 'reason', message: 'reason is required when rejecting a request.' });
		}
		if (details.length > 0 || body.status === undefined || !isEnrollmentStatus(body.status) || body.changedBy === undefined) {
			return c.json(
				{
					error: {
						code: 'INVALID_REQUEST',
						message: 'The request could not be completed.',
						details,
					},
				},
				400,
			);
		}
		try {
			const updated = await applicationServices.Catalog.EnrollmentRequest.updateStatus({
				id: c.req.param('id') ?? '',
				status: body.status,
				changedBy: body.changedBy,
				...(body.reason === undefined ? {} : { reason: body.reason }),
			});
			return c.json(toEnrollment(updated));
		} catch (error) {
			const failure = enrollmentError(error);
			if (failure) return c.json(failure.body, failure.status);
			throw error;
		}
	});
	return app;
}

export const restHandlerCreator = (applicationServicesFactory: ApplicationServicesFactory): HttpHandler => {
	const handler = azureHonoHandler(createRestApp(applicationServicesFactory).fetch);
	return (request: HttpRequest, context: InvocationContext) => handler(request, context);
};
