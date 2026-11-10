import * as DomainSeedwork from '@cellix/domain-seedwork/value-object';
import type { CourseModality, CourseStatus } from './course.entity.ts';

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

	public static from(value: CourseModality): CourseModalityValue {
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

	public static from(value: CourseStatus): CourseStatusValue {
		return new CourseStatusValue({ value });
	}
}
