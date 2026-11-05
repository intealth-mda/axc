export const CourseModality = { Online: 'online', InPerson: 'in-person', Hybrid: 'hybrid' } as const;
export type CourseModality = (typeof CourseModality)[keyof typeof CourseModality];

export const CourseStatus = { Draft: 'draft', Active: 'active', Retired: 'retired' } as const;
export type CourseStatus = (typeof CourseStatus)[keyof typeof CourseStatus];

export const isCourseModality = (value: string): value is CourseModality => (Object.values(CourseModality) as string[]).includes(value);
export const isCourseStatus = (value: string): value is CourseStatus => (Object.values(CourseStatus) as string[]).includes(value);
