export const CourseModalities = { online: 'online', inPerson: 'in-person', hybrid: 'hybrid' } as const;
export type CourseModality = (typeof CourseModalities)[keyof typeof CourseModalities];
export const isCourseModality = (v: string): v is CourseModality => (Object.values(CourseModalities) as string[]).includes(v);

export const CourseStatuses = { draft: 'draft', active: 'active', retired: 'retired' } as const;
export type CourseStatus = (typeof CourseStatuses)[keyof typeof CourseStatuses];
export const isCourseStatus = (v: string): v is CourseStatus => (Object.values(CourseStatuses) as string[]).includes(v);
