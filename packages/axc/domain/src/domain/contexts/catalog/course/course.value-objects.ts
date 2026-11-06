export const Modality = { Online: 'online', InPerson: 'in-person', Hybrid: 'hybrid' } as const;
export type Modality = (typeof Modality)[keyof typeof Modality];

export const CourseStatus = { Draft: 'draft', Active: 'active', Retired: 'retired' } as const;
export type CourseStatus = (typeof CourseStatus)[keyof typeof CourseStatus];

const modalities: readonly string[] = Object.values(Modality);
const courseStatuses: readonly string[] = Object.values(CourseStatus);

export const isModality = (value: string): value is Modality => modalities.includes(value);
export const isCourseStatus = (value: string): value is CourseStatus => courseStatuses.includes(value);
