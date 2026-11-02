import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { courseSeed, createMemoryMongoServer } from '@axc/service-mongoose';
import { AzureFunctionsLocalSettings } from '@cellix/local-dev';
import { ApiInfrastructure } from '@cellix/serenity-framework/infrastructure/api';
import { ProcessTestServer } from '@cellix/serenity-framework/servers';
import mongoose from 'mongoose';

const acceptanceDir = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.resolve(acceptanceDir, '../../../../apps/api');
const port = '7071';
const memoryMongo = createMemoryMongoServer();

export const stopMemoryMongo = async (): Promise<void> => {
	await mongoose.disconnect();
	await memoryMongo.stop();
};

/**
 * A catalog scenario needs Mongo. In setupEnvironment, start createMemoryMongoServer from
 * @axc/service-mongoose, set process.env.MONGODB_URI to getUri(), and stop the server in afterAll.
 * The API process inherits the variable. Do not start that server in apps/api/src/index.ts.
 */

export const apiServer = new ProcessTestServer({
	serverName: 'agentCourses-api',
	executable: 'node',
	spawnArgs: ['--experimental-strip-types', 'scripts/start-host.ts'],
	cwd: apiDir,
	readyMarker: /Host lock lease acquired/,
	url: `http://127.0.0.1:${port}/health`,
	startupTimeoutMs: 180_000,
	portsToCloseBeforeStart: [7071],
});

export const infrastructure = ApiInfrastructure.create({
	setupEnvironment: async () => {
		await memoryMongo.start();
		const mongoUri = memoryMongo.getUri();
		const env = process.env as { MONGODB_URI?: string };
		env.MONGODB_URI = mongoUri;
		new AzureFunctionsLocalSettings({
			appDir: apiDir,
			values: {
				FUNCTIONS_WORKER_RUNTIME: 'node',
				AzureWebJobsFeatureFlags: 'EnableWorkerIndexing',
			},
		}).sync();
		await mongoose.connect(mongoUri);
		const collection = mongoose.connection.collection('courses');
		await collection.insertMany(courseSeed as unknown as Parameters<typeof collection.insertMany>[0]);
		await mongoose.disconnect();
	},
})
	.addServer('api', apiServer)
	.finalize();
