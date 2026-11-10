import * as DomainSeedwork from '@cellix/domain-seedwork/value-object';
import type { CourseModality, CourseStatus } from './course.entity.ts';

interface CourseModalityProps extends DomainSeedwork.ValueObjectProps {
	readonly value: CourseModality;
}

export class CourseModalityValue extends DomainSeedwork.ValueObject<CourseModalityProps> {
	public get value(): CourseModality {
		return this.props.value;
	}
}

interface CourseStatusProps extends DomainSeedwork.ValueObjectProps {
	readonly value: CourseStatus;
}

export class CourseStatusValue extends DomainSeedwork.ValueObject<CourseStatusProps> {
	public get value(): CourseStatus {
		return this.props.value;
	}
}
