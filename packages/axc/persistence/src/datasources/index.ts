import { mongooseContextBuilder } from '@axc/data-sources-mongoose-models';
import { createConnection } from 'mongoose';
import { DomainDataSource } from './domain/index.ts';
import { ReadonlyDataSource } from './readonly/index.ts';
import { courseFixtures } from './readonly/training/course/course.fixtures.ts';
import type { MemoryStore } from './store.ts';
export const createDataSources = () => {
	const models = mongooseContextBuilder(createConnection());
	const courses = courseFixtures();
	for (const row of courses) {
		const error = new models.Course(row).validateSync();
		if (error) throw error;
	}
	const store: MemoryStore = { courses: new Map(courses.map((row) => [row.id, row])), enrollments: new Map(), tail: Promise.resolve() };
	return { readonlyDataSource: ReadonlyDataSource(store), domainDataSource: DomainDataSource(store) };
};
export type DataSources = ReturnType<typeof createDataSources>;
