import * as DomainSeedwork from '@cellix/domain-seedwork/aggregate-root';
import type { Visa } from '@cellix/domain-seedwork/visa';
import type { CourseProps } from './course.entity.ts';
import type { CoursePassport } from './course.passport.ts';
import { CourseModalityValue, CourseStatusValue } from './course.value-objects.ts';

export interface CourseCatalogVisa extends Visa<CoursePassport> {
	readonly allowsCatalogRead: true;
}

export class Course extends DomainSeedwork.AggregateRoot<CourseProps, CoursePassport> {
	private constructor(props: CourseProps, passport: CoursePassport) {
		super(props, passport);
	}

	public static getNewInstance(props: CourseProps, passport: CoursePassport): Course {
		const modality = CourseModalityValue.from(props.modality).value;
		const status = CourseStatusValue.from(props.status).value;
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
}
