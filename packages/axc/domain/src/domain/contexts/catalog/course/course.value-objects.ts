import * as DomainSeedwork from '@cellix/domain-seedwork/value-object';

interface CourseTagListProps {
	readonly tags: readonly string[];
}

export class CourseTagList extends DomainSeedwork.ValueObject<CourseTagListProps> {
	private constructor(props: CourseTagListProps) {
		super(props);
	}

	public static create(tags: readonly string[]): CourseTagList {
		return new CourseTagList({ tags });
	}

	public contains(tag: string): boolean {
		const needle = tag.toLowerCase();
		return this.props.tags.some((item) => item.toLowerCase() === needle);
	}

	public includesText(text: string): boolean {
		const needle = text.toLowerCase();
		return this.props.tags.some((item) => item.toLowerCase().includes(needle));
	}
}
