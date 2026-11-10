import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { CourseDraft, CourseProps } from './course.entity.ts';
import type { CoursePassport } from './course.passport.ts';
import { CourseModality, CourseStatus } from './course.value-objects.ts';
import type { CourseVisa } from './course.visa.ts';

const DomainSeedwork = { AggregateRoot };

export class Course extends DomainSeedwork.AggregateRoot<CourseProps, CoursePassport> {
	private visa?: CourseVisa;

	private constructor(props: CourseProps, passport: CoursePassport, visa?: CourseVisa) {
		super(props, passport);
		if (visa !== undefined) {
			this.visa = visa;
		}
	}

	static getNewInstance(draft: CourseDraft, passport: CoursePassport, visa?: CourseVisa): Course {
		const modality = CourseModality.from(draft.modality);
		const status = CourseStatus.from(draft.status);
		const props: CourseProps = {
			id: draft.id,
			title: draft.title,
			summary: draft.summary,
			modality: modality.value,
			status: status.value,
			tags: [...draft.tags],
			createdAt: draft.createdAt,
			updatedAt: draft.updatedAt,
		};
		if (visa === undefined) {
			return new Course(props, passport);
		}
		return new Course(props, passport, visa);
	}

	override get id(): string {
		return this.props.id;
	}

	get title(): string {
		return this.props.title;
	}

	get summary(): string {
		return this.props.summary;
	}

	get modality(): CourseProps['modality'] {
		return this.props.modality;
	}

	get status(): CourseProps['status'] {
		return this.props.status;
	}

	get tags(): readonly string[] {
		return [...this.props.tags];
	}

	get createdAt(): string {
		return this.props.createdAt;
	}

	get updatedAt(): string {
		return this.props.updatedAt;
	}

	allows(check: (permissions: Readonly<{ canReadCatalog: boolean }>) => boolean): boolean {
		const visa = this.visa;
		if (visa === undefined) {
			return true;
		}
		return visa.determineIf(check);
	}
}
