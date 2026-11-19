import { COURSE_CATALOG_SEED, Course, type CourseCatalog } from '@axc/domain';

/** Process-local catalog seeded with the sample course fixture. */
export function createSeededCourseCatalog(): CourseCatalog {
	const courses = COURSE_CATALOG_SEED.map((props) => Course.create(props));
	const ids = new Set<string>();
	for (const course of courses) {
		if (ids.has(course.id)) {
			throw new Error(`Duplicate course id ${course.id}`);
		}
		ids.add(course.id);
	}
	const stored = Object.freeze([...courses]);
	return {
		listCourses() {
			return Promise.resolve(stored);
		},
	};
}
