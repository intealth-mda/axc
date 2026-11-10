export const CourseModalities = { Online: 'online', InPerson: 'in-person', Hybrid: 'hybrid' } as const;
export type CourseModality = (typeof CourseModalities)[keyof typeof CourseModalities];
export const CourseStatuses = { Draft: 'draft', Active: 'active', Retired: 'retired' } as const;
export type CourseStatus = (typeof CourseStatuses)[keyof typeof CourseStatuses];

export const isCourseModality = (v: string): v is CourseModality => (Object.values(CourseModalities) as string[]).includes(v);
export const isCourseStatus = (v: string): v is CourseStatus => (Object.values(CourseStatuses) as string[]).includes(v);

export class InvalidCourseTitleError extends Error {}

export class CourseTitle {
	readonly value: string;
	constructor(value: string) {
		const trimmed = value.trim();
		if (trimmed === '') throw new InvalidCourseTitleError('title must not be empty');
		this.value = trimmed;
	}
}
