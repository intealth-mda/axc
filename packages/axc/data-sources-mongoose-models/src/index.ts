import type { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { CourseModelFactory } from './models/course/course.model.ts';

export type { Course, CourseModelType } from './models/course/course.model.ts';
export { CourseModelName } from './models/course/course.model.ts';

export const mongooseContextBuilder = (initializedService: MongooseSeedwork.MongooseContextFactory) => {
	return {
		Course: CourseModelFactory(initializedService),
	};
};
export { courseSeed } from './models/course/course.seed.ts';
