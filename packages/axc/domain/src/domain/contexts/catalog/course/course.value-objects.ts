export const Modality = { Online: 'online', InPerson: 'in-person', Hybrid: 'hybrid' } as const;
export type Modality = (typeof Modality)[keyof typeof Modality];
export const CourseStatus = { Draft: 'draft', Active: 'active', Retired: 'retired' } as const;
export type CourseStatus = (typeof CourseStatus)[keyof typeof CourseStatus];

export const isModality = (v: string): v is Modality => (Object.values(Modality) as string[]).includes(v);
export const isCourseStatus = (v: string): v is CourseStatus => (Object.values(CourseStatus) as string[]).includes(v);
