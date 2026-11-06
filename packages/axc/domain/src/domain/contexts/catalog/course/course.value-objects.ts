export const CourseModalities = { Online: 'online', InPerson: 'in-person', Hybrid: 'hybrid' } as const;
export type CourseModality = (typeof CourseModalities)[keyof typeof CourseModalities];
export const isCourseModality = (v: string): v is CourseModality => (Object.values(CourseModalities) as string[]).includes(v);

export const CourseStatuses = { Draft: 'draft', Active: 'active', Retired: 'retired' } as const;
export type CourseStatus = (typeof CourseStatuses)[keyof typeof CourseStatuses];
export const isCourseStatus = (v: string): v is CourseStatus => (Object.values(CourseStatuses) as string[]).includes(v);

export const CourseSortFields = { Title: 'title', CreatedAt: 'createdAt', UpdatedAt: 'updatedAt' } as const;
export type CourseSortField = (typeof CourseSortFields)[keyof typeof CourseSortFields];
export const isCourseSortField = (v: string): v is CourseSortField => (Object.values(CourseSortFields) as string[]).includes(v);

export class InvalidCourseTitleError extends Error {}

export class CourseTitle {
	readonly value: string;
	constructor(value: string) {
		if (value.trim() === '') throw new InvalidCourseTitleError('title must not be empty');
		this.value = value;
	}
}
