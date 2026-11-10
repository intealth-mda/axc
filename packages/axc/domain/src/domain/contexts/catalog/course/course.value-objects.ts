import { ValueObject, type ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import { type CourseModality, type CourseStatus, isCourseModality, isCourseStatus } from './course.entity.ts';

interface CourseModalityProps extends ValueObjectProps {
	readonly value: CourseModality;
}

interface CourseStatusProps extends ValueObjectProps {
	readonly value: CourseStatus;
}

export class CourseModalityValue extends ValueObject<CourseModalityProps> {
	private constructor(props: CourseModalityProps) {
		super(props);
	}

	public static create(value: string): CourseModalityValue {
		if (!isCourseModality(value)) {
			throw new Error('modality must be one of online, in-person, hybrid.');
		}
		return new CourseModalityValue({ value });
	}

	public get value(): CourseModality {
		return this.props.value;
	}
}

export class CourseStatusValue extends ValueObject<CourseStatusProps> {
	private constructor(props: CourseStatusProps) {
		super(props);
	}

	public static create(value: string): CourseStatusValue {
		if (!isCourseStatus(value)) {
			throw new Error('status must be one of draft, active, retired.');
		}
		return new CourseStatusValue({ value });
	}

	public get value(): CourseStatus {
		return this.props.value;
	}
}
