import * as DomainSeedwork from '@cellix/domain-seedwork/value-object';
import { type CourseModality, type CourseStatus, isCourseModality, isCourseStatus } from './course.entity.ts';

interface CourseModalityProps extends DomainSeedwork.ValueObjectProps {
	readonly value: CourseModality;
}

export class CourseModalityValue extends DomainSeedwork.ValueObject<CourseModalityProps> {
	private constructor(props: CourseModalityProps) {
		super(props);
	}

	public get value(): CourseModality {
		return this.props.value;
	}

	public static from(value: string): CourseModalityValue {
		if (!isCourseModality(value)) {
			throw new Error(`Invalid modality: ${value}`);
		}
		return new CourseModalityValue({ value });
	}
}

interface CourseStatusProps extends DomainSeedwork.ValueObjectProps {
	readonly value: CourseStatus;
}

export class CourseStatusValue extends DomainSeedwork.ValueObject<CourseStatusProps> {
	private constructor(props: CourseStatusProps) {
		super(props);
	}

	public get value(): CourseStatus {
		return this.props.value;
	}

	public static from(value: string): CourseStatusValue {
		if (!isCourseStatus(value)) {
			throw new Error(`Invalid status: ${value}`);
		}
		return new CourseStatusValue({ value });
	}
}
