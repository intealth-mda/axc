export const CourseModality = { Online: 'online', InPerson: 'in-person', Hybrid: 'hybrid' } as const;
export type CourseModality = (typeof CourseModality)[keyof typeof CourseModality];
export const CourseStatus = { Draft: 'draft', Active: 'active', Retired: 'retired' } as const;
export type CourseStatus = (typeof CourseStatus)[keyof typeof CourseStatus];

export const isCourseModality = (v: string): v is CourseModality => (Object.values(CourseModality) as string[]).includes(v);
export const isCourseStatus = (v: string): v is CourseStatus => (Object.values(CourseStatus) as string[]).includes(v);
