import { ValueObject, type ValueObjectProps } from '@cellix/domain-seedwork/value-object';

export const COURSE_MODALITIES = ['online', 'in-person', 'hybrid'] as const;
export const COURSE_STATUSES = ['draft', 'active', 'retired'] as const;

export type CourseModalityValue = (typeof COURSE_MODALITIES)[number];
export type CourseStatusValue = (typeof COURSE_STATUSES)[number];

interface ModalityProps extends ValueObjectProps {
	readonly value: CourseModalityValue;
}

interface StatusProps extends ValueObjectProps {
	readonly value: CourseStatusValue;
}

function isModality(value: string): value is CourseModalityValue {
	return (COURSE_MODALITIES as readonly string[]).includes(value);
}

function isStatus(value: string): value is CourseStatusValue {
	return (COURSE_STATUSES as readonly string[]).includes(value);
}

export class CourseModality extends ValueObject<ModalityProps> {
	private constructor(props: ModalityProps) {
		super(props);
	}

	static from(value: string): CourseModality {
		if (!isModality(value)) {
			throw new Error('modality must be one of online, in-person, hybrid.');
		}
		return new CourseModality({ value });
	}

	get value(): CourseModalityValue {
		return this.props.value;
	}
}

export class CourseStatus extends ValueObject<StatusProps> {
	private constructor(props: StatusProps) {
		super(props);
	}

	static from(value: string): CourseStatus {
		if (!isStatus(value)) {
			throw new Error('status must be one of draft, active, retired.');
		}
		return new CourseStatus({ value });
	}

	get value(): CourseStatusValue {
		return this.props.value;
	}
}
