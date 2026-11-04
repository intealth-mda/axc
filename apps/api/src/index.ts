import { type ApiContext, type ApplicationServices, buildApplicationServicesFactory } from '@axc/application-services';
import { createCourseRepository, createEnrollmentRequestRepository } from '@axc/persistence';
import { restHandlerCreator } from '@axc/rest';
import { Cellix } from '@cellix/api-core';
import * as RuntimeConfig from './service-config/runtime/index.ts';

const courses = createCourseRepository();
const enrollmentRequests = createEnrollmentRequestRepository();
let enrollmentSequence = 1;

Cellix.initializeInfrastructureServices<ApiContext, ApplicationServices>((serviceRegistry) => {
	void serviceRegistry;
})
	.setContext(() => {
		return {
			environment: RuntimeConfig.environment,
		};
	})
	.initializeApplicationServices((context) =>
		buildApplicationServicesFactory(context, {
			courses,
			enrollmentRequests,
			now: () => new Date(),
			newEnrollmentId: () => {
				const id = `enroll-${String(enrollmentSequence).padStart(3, '0')}`;
				enrollmentSequence += 1;
				return id;
			},
		}),
	)
	.registerAzureFunctionHttpHandler('health', { route: 'health', methods: ['GET'], authLevel: 'anonymous' }, restHandlerCreator)
	.registerAzureFunctionHttpHandler('courses', { route: 'api/courses', methods: ['GET'], authLevel: 'anonymous' }, restHandlerCreator)
	.registerAzureFunctionHttpHandler('enrollment-requests', { route: 'api/enrollment-requests', methods: ['GET', 'POST'], authLevel: 'anonymous' }, restHandlerCreator)
	.registerAzureFunctionHttpHandler('enrollment-request-status', { route: 'api/enrollment-requests/{id}/status', methods: ['PATCH'], authLevel: 'anonymous' }, restHandlerCreator)
	.registerAzureFunctionHttpHandler('enrollment-request', { route: 'api/enrollment-requests/{id}', methods: ['GET'], authLevel: 'anonymous' }, restHandlerCreator)
	.startUp();
