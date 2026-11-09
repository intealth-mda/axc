import { type ApiContext, type ApplicationServices, buildApplicationServicesFactory } from '@axc/application-services';
import { Persistence } from '@axc/persistence';
import { restHandlerCreator } from '@axc/rest';
import { Cellix } from '@cellix/api-core';
import mongoose from 'mongoose';
import * as RuntimeConfig from './service-config/runtime/index.ts';

const env = process.env as { MONGODB_URI?: string };
if (env.MONGODB_URI !== undefined) {
	await mongoose.connect(env.MONGODB_URI);
}

Cellix.initializeInfrastructureServices<ApiContext, ApplicationServices>((serviceRegistry) => {
	void serviceRegistry;
})
	.setContext(() => {
		return {
			environment: RuntimeConfig.environment,
			dataSourcesFactory: Persistence({ service: mongoose }),
		};
	})
	.initializeApplicationServices((context) => buildApplicationServicesFactory(context))
	.registerAzureFunctionHttpHandler('health', { route: 'health', methods: ['GET'], authLevel: 'anonymous' }, restHandlerCreator)

	.registerAzureFunctionHttpHandler('course-search-courses', { route: 'api/courses', methods: ['GET'], authLevel: 'anonymous' }, restHandlerCreator)
	.startUp();
