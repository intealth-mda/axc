import { describe, expect, it } from 'vitest';
import { Course } from './course.aggregate.ts';

const course = Course.getNewInstance({ id: 'c1', title: 'AI Security', summary: 'Secure coding', modality: 'online', status: 'active', tags: ['AI'], createdAt: 't', updatedAt: 't' });

describe('Course', () => {
	it('matches keyword in title, summary, tags case-insensitively', () => {
		expect(course.matchesKeyword('security')).toBe(true);
		expect(course.matchesKeyword('CODING')).toBe(true);
		expect(course.matchesKeyword('ai')).toBe(true);
		expect(course.matchesKeyword('cloud')).toBe(false);
	});
	it('matches tag exactly, case-insensitively', () => {
		expect(course.hasTag('ai')).toBe(true);
		expect(course.hasTag('a')).toBe(false);
	});
	it('rejects empty title', () => expect(() => Course.getNewInstance({ ...course.props, title: '' })).toThrow());
});
