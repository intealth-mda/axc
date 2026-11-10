import { type ApiContext, type ApplicationServices, buildApplicationServicesFactory } from '@axc/application-services';
import { restHandlerCreator } from '@axc/rest';
import { Cellix } from '@cellix/api-core';
import * as RuntimeConfig from './service-config/runtime/index.ts';

Cellix.initializeInfrastructureServices<ApiContext, ApplicationServices>((serviceRegistry) => {
	void serviceRegistry;
})
	.setContext(() => {
		return {
			environment: RuntimeConfig.environment,
		};
	})
	.initializeApplicationServices((context) => buildApplicationServicesFactory(context))
	.registerAzureFunctionHttpHandler('health', { route: 'health', methods: ['GET'], authLevel: 'anonymous' }, restHandlerCreator)
	.registerAzureFunctionHttpHandler('courses', { route: 'api/courses', methods: ['GET'], authLevel: 'anonymous' }, restHandlerCreator)
	.registerAzureFunctionHttpHandler('enrollment-requests', { route: 'api/enrollment-requests', methods: ['GET', 'POST'], authLevel: 'anonymous' }, restHandlerCreator)
	.registerAzureFunctionHttpHandler('enrollment-request-item', { route: 'api/enrollment-requests/{*path}', methods: ['GET', 'PATCH'], authLevel: 'anonymous' }, restHandlerCreator)
	.startUp();
