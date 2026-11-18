export const CourseModalities = { online: 'online', inPerson: 'in-person', hybrid: 'hybrid' } as const;
export type CourseModality = (typeof CourseModalities)[keyof typeof CourseModalities];
export const CourseStatuses = { draft: 'draft', active: 'active', retired: 'retired' } as const;
export type CourseStatus = (typeof CourseStatuses)[keyof typeof CourseStatuses];

export const isCourseModality = (v: string): v is CourseModality => (Object.values(CourseModalities) as string[]).includes(v);
export const isCourseStatus = (v: string): v is CourseStatus => (Object.values(CourseStatuses) as string[]).includes(v);

export class InvalidCourseTitleError extends Error {}

export class CourseTitle {
	readonly value: string;
	constructor(value: string) {
		const v = value.trim();
		if (v.length === 0 || v.length > 200) throw new InvalidCourseTitleError('title must be 1-200 characters');
		this.value = v;
	}
}
