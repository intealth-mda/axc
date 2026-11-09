import { expect, it } from 'vitest';
import { CourseModality, CourseStatus } from './course.value-objects.ts';

it.each(['online', 'in-person', 'hybrid'])('accepts modality %s', (value) => expect(new CourseModality(value).value).toBe(value));
it.each(['draft', 'active', 'retired'])('accepts status %s', (value) => expect(new CourseStatus(value).value).toBe(value));
it.each(['invalid', '', null, 1, {}])('rejects invalid course values %s', (value) => {
	expect(() => new CourseModality(value)).toThrow();
	expect(() => new CourseStatus(value)).toThrow();
});
