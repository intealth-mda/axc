import { ValueObject, type ValueObjectProps } from '@cellix/domain-seedwork/value-object';

export const COURSE_MODALITIES = ['online', 'in-person', 'hybrid'] as const;
export type CourseModality = (typeof COURSE_MODALITIES)[number];

export const COURSE_STATUSES = ['draft', 'active', 'retired'] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const COURSE_SORTS = ['title', 'createdAt', 'updatedAt'] as const;
export type CourseSort = (typeof COURSE_SORTS)[number];

export const DEFAULT_COURSE_PAGE = 1;
export const DEFAULT_COURSE_PAGE_SIZE = 10;
export const MAX_COURSE_PAGE_SIZE = 50;

interface CourseModalityProps extends ValueObjectProps {
	readonly value: CourseModality;
}

export class CourseModalityValue extends ValueObject<CourseModalityProps> {
	public constructor(value: CourseModality) {
		super({ value });
	}

	public get value(): CourseModality {
		return this.props.value;
	}
}

interface CourseStatusProps extends ValueObjectProps {
	readonly value: CourseStatus;
}

export class CourseStatusValue extends ValueObject<CourseStatusProps> {
	public constructor(value: CourseStatus) {
		super({ value });
	}

	public get value(): CourseStatus {
		return this.props.value;
	}
}
