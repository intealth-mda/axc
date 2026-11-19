export const CourseModality = { Online: 'online', InPerson: 'in-person', Hybrid: 'hybrid' } as const;
export type CourseModality = (typeof CourseModality)[keyof typeof CourseModality];
export const CourseStatus = { Draft: 'draft', Active: 'active', Retired: 'retired' } as const;
export type CourseStatus = (typeof CourseStatus)[keyof typeof CourseStatus];
export const CourseSort = { Title: 'title', CreatedAt: 'createdAt', UpdatedAt: 'updatedAt' } as const;
export type CourseSort = (typeof CourseSort)[keyof typeof CourseSort];

const has = <T extends string>(map: Record<string, T>, v: string): v is T => (Object.values(map) as string[]).includes(v);
export const isCourseModality = (v: string): v is CourseModality => has(CourseModality, v);
export const isCourseStatus = (v: string): v is CourseStatus => has(CourseStatus, v);
export const isCourseSort = (v: string): v is CourseSort => has(CourseSort, v);
