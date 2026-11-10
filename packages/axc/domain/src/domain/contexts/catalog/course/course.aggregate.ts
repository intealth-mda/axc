import * as DomainSeedwork from '@cellix/domain-seedwork/aggregate-root';
import type { CourseDomainPermissions } from './course.domain-permissions.ts';
import type { CourseEntityReference, CourseProps } from './course.entity.ts';
import type { CoursePassport } from './course.passport.ts';
import { type CourseModality, CourseModalityValue, type CourseStatus, CourseStatusValue } from './course.value-objects.ts';
import type { CourseVisa } from './course.visa.ts';

export class Course extends DomainSeedwork.AggregateRoot<CourseProps, CoursePassport> implements CourseEntityReference, CourseVisa {
	private constructor(props: CourseProps, passport: CoursePassport) {
		super(props, passport);
	}

	public static getNewInstance(props: CourseProps, passport: CoursePassport): Course {
		const modality = new CourseModalityValue(props.modality).value;
		const status = new CourseStatusValue(props.status).value;
		return new Course(
			{
				id: props.id,
				title: props.title,
				summary: props.summary,
				modality,
				status,
				tags: [...props.tags],
				createdAt: props.createdAt,
				updatedAt: props.updatedAt,
			},
			passport,
		);
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
		return [...this.props.tags];
	}

	public get createdAt(): string {
		return this.props.createdAt;
	}

	public get updatedAt(): string {
		return this.props.updatedAt;
	}

	public determineIf(func: (permissions: Readonly<CourseDomainPermissions>) => boolean): boolean {
		return func({ canReadCatalog: true });
	}
}
