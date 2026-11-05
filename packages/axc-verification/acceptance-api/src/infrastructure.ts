import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { courseSeed, createMemoryMongoServer, enrollmentRequestSeed } from '@axc/service-mongoose';
import { AzureFunctionsLocalSettings } from '@cellix/local-dev';
import { ApiInfrastructure } from '@cellix/serenity-framework/infrastructure/api';
import { ProcessTestServer } from '@cellix/serenity-framework/servers';
import mongoose from 'mongoose';

const acceptanceDir = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.resolve(acceptanceDir, '../../../../apps/api');
const port = '7071';

let memoryMongo: ReturnType<typeof createMemoryMongoServer> | undefined;

/** The replica set is already started here. Insert `<camel>Seed` in setupEnvironment. Do not start another server. */
export async function stopMemoryMongo(): Promise<void> {
	if (memoryMongo === undefined) return;
	await memoryMongo.stop();
	memoryMongo = undefined;
}

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
		memoryMongo = createMemoryMongoServer();
		await memoryMongo.start();
		const env = process.env as { MONGODB_URI?: string };
		env.MONGODB_URI = memoryMongo.getUri();
		await mongoose.connect(env.MONGODB_URI);
		const collection = mongoose.connection.collection('courses');
		await collection.insertMany(courseSeed as unknown as Parameters<typeof collection.insertMany>[0]);
		const enrollmentRequests = mongoose.connection.collection('enrollmentrequests');
		await enrollmentRequests.insertMany(enrollmentRequestSeed as unknown as Parameters<typeof enrollmentRequests.insertMany>[0]);
		await mongoose.disconnect();
		new AzureFunctionsLocalSettings({
			appDir: apiDir,
			values: {
				FUNCTIONS_WORKER_RUNTIME: 'node',
				AzureWebJobsFeatureFlags: 'EnableWorkerIndexing',
			},
		}).sync();
	},
})
	.addServer('api', apiServer)
	.finalize();
