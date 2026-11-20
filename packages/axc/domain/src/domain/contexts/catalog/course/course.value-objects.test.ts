import { describe, expect, it } from 'vitest';
import { isCourseModality, isCourseStatus } from './course.value-objects.ts';

describe('course value objects', () => {
	it.each(['online', 'in-person', 'hybrid'])('modality %s valid', (m) => expect(isCourseModality(m)).toBe(true));
	it.each(['draft', 'active', 'retired'])('status %s valid', (s) => expect(isCourseStatus(s)).toBe(true));
	it('rejects unknown', () => {
		expect(isCourseModality('remote')).toBe(false);
		expect(isCourseStatus('Active')).toBe(false);
	});
});
