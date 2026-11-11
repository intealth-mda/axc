export const CourseModalities = { Online: 'online', InPerson: 'in-person', Hybrid: 'hybrid' } as const;
export type CourseModality = (typeof CourseModalities)[keyof typeof CourseModalities];

export const CourseStatuses = { Draft: 'draft', Active: 'active', Retired: 'retired' } as const;
export type CourseStatus = (typeof CourseStatuses)[keyof typeof CourseStatuses];

export const CourseSortFields = { Title: 'title', CreatedAt: 'createdAt', UpdatedAt: 'updatedAt' } as const;
export type CourseSortField = (typeof CourseSortFields)[keyof typeof CourseSortFields];

export const isCourseModality = (v: string): v is CourseModality => (Object.values(CourseModalities) as string[]).includes(v);
export const isCourseStatus = (v: string): v is CourseStatus => (Object.values(CourseStatuses) as string[]).includes(v);
export const isCourseSortField = (v: string): v is CourseSortField => (Object.values(CourseSortFields) as string[]).includes(v);
