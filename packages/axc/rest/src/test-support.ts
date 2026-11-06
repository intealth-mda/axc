import type { ApplicationServices, ApplicationServicesFactory } from '@axc/application-services';
import { vi } from 'vitest';
import { createRestApp } from './index.ts';
export function fixture() {
	const enrollment = {
		id: 'enroll-001',
		courseId: 'course-001',
		learnerEmail: 'learner@example.org',
		justification: 'I need this course for my upcoming project.',
		status: 'pending' as const,
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
		statusHistory: [],
	};
	const services: ApplicationServices = {
		health: { getStatus: () => ({ status: 'ok', service: 'agentCourses-api', projectCode: 'axc', environment: 'test', timestamp: new Date().toISOString() }) },
		Training: {
			Course: { queryCourses: vi.fn(() => Promise.resolve({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 })) },
			EnrollmentRequest: {
				create: vi.fn(() => Promise.resolve(enrollment)),
				getById: vi.fn(() => Promise.resolve(enrollment)),
				queryRequests: vi.fn(() => Promise.resolve([enrollment])),
				update: vi.fn(() => Promise.resolve(enrollment)),
			},
		},
	};
	const factory: ApplicationServicesFactory = { forRequest: vi.fn(() => Promise.resolve(services)) };
	return { services, factory, app: createRestApp(factory), enrollment };
}
