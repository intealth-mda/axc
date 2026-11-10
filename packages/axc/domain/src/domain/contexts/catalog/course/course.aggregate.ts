import * as DomainSeedwork from '@cellix/domain-seedwork/aggregate-root';
import type { Visa } from '@cellix/domain-seedwork/visa';
import type { CatalogPassport, CatalogReadPermissions } from '../catalog.passport.ts';
import type { CourseModality, CourseProps, CourseStatus } from './course.entity.ts';
import { CourseModalityValue, CourseStatusValue } from './course.value-objects.ts';

export class Course extends DomainSeedwork.AggregateRoot<CourseProps, CatalogPassport> {
	private readonly visa: Visa<CatalogReadPermissions>;

	private constructor(props: CourseProps, passport: CatalogPassport, visa: Visa<CatalogReadPermissions>) {
		super(
			{
				id: props.id,
				title: props.title,
				summary: props.summary,
				modality: props.modality,
				status: props.status,
				tags: [...props.tags],
				createdAt: props.createdAt,
				updatedAt: props.updatedAt,
			},
			passport,
		);
		this.visa = visa;
	}

	public static getNewInstance(props: CourseProps, passport: CatalogPassport, visa: Visa<CatalogReadPermissions>): Course {
		const course = new Course(props, passport, visa);
		if (!course.allowsRead()) {
			throw new Error('Catalog read is not permitted.');
		}
		return course;
	}

	public get title(): string {
		return this.props.title;
	}

	public get summary(): string {
		return this.props.summary;
	}

	public get modality(): CourseModality {
		return new CourseModalityValue({ value: this.props.modality }).value;
	}

	public get status(): CourseStatus {
		return new CourseStatusValue({ value: this.props.status }).value;
	}

	public get tags(): readonly string[] {
		return [...this.props.tags];
	}

	public get createdAt(): string {
		return this.props.createdAt;
	}

	public get updatedAt(): string {
		return this.props.updatedAt;
	}

	private allowsRead(): boolean {
		return this.visa.determineIf((permissions) => permissions.canReadCatalog);
	}
}
