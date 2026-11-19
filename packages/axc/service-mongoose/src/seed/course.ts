import { Domain } from '@axc/domain';

/**
 * Insert courseSeed into the Course collection.
 * One object is the example. A catalog task adds the other rows to this array.
 * Start the application and read them back through the endpoint.
 * Do not copy this document into a handler, a read repository, or an in-memory catalog.
 */
export const courseSeed = Domain.Contexts.Types.Course.catalogCourses.map((course) => {
	const sequence = Number(course.id.replace('course-', ''));
	return {
		_id: sequence.toString(16).padStart(24, '0'),
		schemaVersion: '1.0.0',
		version: 0,
		title: course.title,
		summary: course.summary,
		modality: course.modality,
		status: course.status,
		tags: [...course.tags],
		createdAt: new Date(course.createdAt),
		updatedAt: new Date(course.updatedAt),
	};
});
