import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import type { Passport } from '../../passport.ts';
import * as ValueObjects from './course.value-objects.ts';

export interface CourseProps extends DomainEntityProps {
	title: string;
	summary: string;
	modality: string;
	status: string;
	tags: string[];
	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly schemaVersion: string;
}

export interface CourseEntityReference extends Readonly<CourseProps> {}

export class Course<props extends CourseProps> extends AggregateRoot<props, Passport> implements CourseEntityReference {
	private isNew: boolean = false;

	public static getNewInstance<props extends CourseProps>(newProps: props, title: string, summary: string, modality: string, status: string, tags: string[], passport: Passport): Course<props> {
		const newInstance = new Course(newProps, passport);
		newInstance.markAsNew();
		if (!newInstance.isNew) {
			throw new Error('Course was not marked as new');
		}
		newInstance.title = title;
		newInstance.summary = summary;
		newInstance.modality = modality;
		newInstance.status = status;
		newInstance.tags = tags;
		newInstance.isNew = false;
		return newInstance;
	}

	private markAsNew(): void {
		this.isNew = true;
	}

	get title(): string {
		return this.props.title;
	}
	set title(title: string) {
		this.props.title = new ValueObjects.Title(title).valueOf();
	}

	get summary(): string {
		return this.props.summary;
	}
	set summary(summary: string) {
		this.props.summary = new ValueObjects.Summary(summary).valueOf();
	}

	get modality(): string {
		return this.props.modality;
	}
	set modality(modality: string) {
		const value = new ValueObjects.Modality(modality).valueOf();
		if (!ValueObjects.isCourseModality(value)) {
			throw new Error('modality is not an accepted value');
		}
		this.props.modality = value;
	}

	get status(): string {
		return this.props.status;
	}
	set status(status: string) {
		const value = new ValueObjects.Status(status).valueOf();
		if (!ValueObjects.isCourseStatus(value)) {
			throw new Error('status is not an accepted value');
		}
		this.props.status = value;
	}

	get tags(): string[] {
		return this.props.tags;
	}
	set tags(tags: string[]) {
		this.props.tags = new ValueObjects.Tags(tags).valueOf();
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}
	get updatedAt(): Date {
		return this.props.updatedAt;
	}
	get schemaVersion(): string {
		return this.props.schemaVersion;
	}
}
