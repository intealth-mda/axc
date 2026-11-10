import * as DomainSeedwork from '@cellix/domain-seedwork/aggregate-root';
import type { Visa } from '@cellix/domain-seedwork/visa';
import type { CatalogPassport, CatalogReadPermissions } from '../catalog.passport.ts';
import type { CourseModality, CourseProps, CourseStatus } from './course.entity.ts';
import { CourseModalityValue, CourseStatusValue } from './course.value-objects.ts';

export class Course extends DomainSeedwork.AggregateRoot<CourseProps, CatalogPassport> {
	private readonly visa: Visa<CatalogReadPermissions>;

	private constructor(props: CourseProps, passport: CatalogPassport, visa: Visa<CatalogReadPermissions>) {
		super(props, passport);
		this.visa = visa;
	}

	public static getNewInstance(props: CourseProps, passport: CatalogPassport, visa: Visa<CatalogReadPermissions>): Course {
		const modality = CourseModalityValue.create(props.modality);
		const status = CourseStatusValue.create(props.status);
		if (modality.value !== props.modality || status.value !== props.status) {
			throw new Error('Course modality or status did not match the catalog value.');
		}
		return new Course(props, passport, visa);
	}

	public canRead(): boolean {
		return this.visa.determineIf((permissions) => permissions.canReadCatalog);
	}

	public get title(): string {
		return this.props.title;
	}

	public get summary(): string {
		return this.props.summary;
	}

	public get modality(): CourseModality {
		return this.props.modality;
	}

	public get status(): CourseStatus {
		return this.props.status;
	}

	public get tags(): readonly string[] {
		return this.props.tags;
	}

	public get createdAt(): string {
		return this.props.createdAt;
	}

	public get updatedAt(): string {
		return this.props.updatedAt;
	}
}
