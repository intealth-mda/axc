import * as DomainSeedwork from '@cellix/domain-seedwork/aggregate-root';
import type { Visa } from '@cellix/domain-seedwork/visa';
import type { CatalogPassport } from '../catalog.passport.ts';
import type { CourseProps } from './course.entity.ts';
import { CourseModalityValue, CourseStatusValue } from './course.value-objects.ts';

type CourseReadPermissions = {
	readonly canRead: boolean;
};

export class Course extends DomainSeedwork.AggregateRoot<CourseProps, CatalogPassport> {
	private readonly visa: Visa<CourseReadPermissions> | undefined;

	private constructor(props: CourseProps, passport: CatalogPassport, visa?: Visa<CourseReadPermissions>) {
		super(props, passport);
		this.visa = visa;
	}

	public static getNewInstance(props: CourseProps, passport: CatalogPassport, visa?: Visa<CourseReadPermissions>): Course {
		return new Course(props, passport, visa);
	}

	public modalityValue(): CourseModalityValue {
		return CourseModalityValue.from(this.props.modality);
	}

	public statusValue(): CourseStatusValue {
		return CourseStatusValue.from(this.props.status);
	}

	public canRead(): boolean {
		return this.passport.catalogRead;
	}

	public hasVisa(): boolean {
		return this.visa !== undefined;
	}
}
