export const CourseModalities = { online: 'online', inPerson: 'in-person', hybrid: 'hybrid' } as const;
export type CourseModality = (typeof CourseModalities)[keyof typeof CourseModalities];

export const CourseStatuses = { draft: 'draft', active: 'active', retired: 'retired' } as const;
export type CourseStatus = (typeof CourseStatuses)[keyof typeof CourseStatuses];

export const CourseSortFields = { title: 'title', createdAt: 'createdAt', updatedAt: 'updatedAt' } as const;
export type CourseSortField = (typeof CourseSortFields)[keyof typeof CourseSortFields];
