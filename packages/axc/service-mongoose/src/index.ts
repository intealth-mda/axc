import type { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { MongoMemoryReplSet } from 'mongodb-memory-server-core';
import type { Connection } from 'mongoose';

/** Mongoose context factories added in this package use the Cellix mongoose seedwork. */
export type PersistenceContextFactory = MongooseSeedwork.MongooseContextFactory;

/** Active Mongoose connection used by future persistence adapters. */
export type MongoConnection = Connection;

/**
 * Local and test MongoDB process. One node, wired as a replica set.
 * withScopedTransaction rejects a standalone memory server.
 * Uses mongodb-memory-server-core so installs do not run package build scripts.
 */
export function createMemoryMongoServer(): MongoMemoryReplSet {
	return new MongoMemoryReplSet({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
}
