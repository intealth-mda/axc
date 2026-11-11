import * as DomainSeedwork from '@cellix/domain-seedwork/value-object';
import type { StatusHistoryEntry } from './enrollment-request.entity.ts';

interface EnrollmentStatusHistoryProps {
	readonly entries: readonly StatusHistoryEntry[];
}

export class EnrollmentStatusHistory extends DomainSeedwork.ValueObject<EnrollmentStatusHistoryProps> {
	private constructor(props: EnrollmentStatusHistoryProps) {
		super(props);
	}

	public static create(entries: readonly StatusHistoryEntry[]): EnrollmentStatusHistory {
		return new EnrollmentStatusHistory({ entries: [...entries] });
	}

	public append(entry: StatusHistoryEntry): EnrollmentStatusHistory {
		return EnrollmentStatusHistory.create([...this.props.entries, entry]);
	}

	public entries(): StatusHistoryEntry[] {
		return this.props.entries.map((entry) => ({ ...entry }));
	}
}
