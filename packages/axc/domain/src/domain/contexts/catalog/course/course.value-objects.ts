import { ValueObject } from '@cellix/domain-seedwork/value-object';

export const CourseModalities = { online: 'online', inPerson: 'in-person', hybrid: 'hybrid' } as const;
export type CourseModality = (typeof CourseModalities)[keyof typeof CourseModalities];
export const CourseStatuses = { draft: 'draft', active: 'active', retired: 'retired' } as const;
export type CourseStatus = (typeof CourseStatuses)[keyof typeof CourseStatuses];
export const CourseSortFields = ['title', 'createdAt', 'updatedAt'] as const;
export type CourseSortField = (typeof CourseSortFields)[number];

export const isCourseModality = (v: string): v is CourseModality => (Object.values(CourseModalities) as string[]).includes(v);
export const isCourseStatus = (v: string): v is CourseStatus => (Object.values(CourseStatuses) as string[]).includes(v);
export const isCourseSortField = (v: string): v is CourseSortField => (CourseSortFields as readonly string[]).includes(v);

export class InvalidCourseValueError extends Error {
	readonly field: string;
	constructor(field: string, message: string) {
		super(message);
		this.name = 'InvalidCourseValueError';
		this.field = field;
	}
}

export class CourseTitle extends ValueObject<{ value: string }> {
	constructor(value: string) {
		if (value.trim().length === 0) throw new InvalidCourseValueError('title', 'title must not be empty.');
		super({ value });
	}
	get value(): string {
		return this.props.value;
	}
}
