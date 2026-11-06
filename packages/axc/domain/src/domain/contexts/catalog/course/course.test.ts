import { describe, expect, it } from 'vitest';
import { assertCourseSearch, CourseValidationError } from './course.value-objects.ts';

describe('course search validation', () => {
	it.each([{ page: 0 }, { page: 1.5 }, { page: Number.MAX_SAFE_INTEGER + 1 }, { pageSize: 0 }, { pageSize: 51 }, { modality: '' }, { status: 'unknown' }, { sort: 'id' }, { q: ' ' }, { tag: '' }])('rejects %j', (invalid) => {
		expect(() => assertCourseSearch({ page: 1, pageSize: 10, sort: 'title', ...invalid })).toThrow(CourseValidationError);
	});
	it('collects every invalid field', () => {
		try {
			assertCourseSearch({ page: 0, pageSize: 51, sort: 'id', modality: 'other', status: 'other' });
		} catch (error) {
			expect((error as CourseValidationError).details.map((detail) => detail.field)).toEqual(['modality', 'status', 'sort', 'page', 'pageSize']);
			return;
		}
		throw new Error('Expected validation failure');
	});
	it('accepts all enumerated values and maximum pagination', () => {
		for (const modality of ['online', 'in-person', 'hybrid'])
			for (const status of ['draft', 'active', 'retired']) for (const sort of ['title', 'createdAt', 'updatedAt']) expect(() => assertCourseSearch({ modality, status, sort, page: 1, pageSize: 50 })).not.toThrow();
	});
});
