import type { CourseRecord, EnrollmentRequestRecord } from '@axc/data-sources-mongoose-models';
import { courseFixtures } from './fixtures.ts';
export class MemoryStore {
	readonly courses: Map<string, CourseRecord>;
	requests = new Map<string, EnrollmentRequestRecord>();
	private queue: Promise<void> = Promise.resolve();
	constructor() {
		this.courses = new Map(courseFixtures.map((course) => [course.id, structuredClone(course)]));
	}
	async transaction(work: (records: Map<string, EnrollmentRequestRecord>) => Promise<void>): Promise<void> {
		const previous = this.queue;
		let release = () => {
			/* initialized before use */
		};
		this.queue = new Promise<void>((resolve) => {
			release = resolve;
		});
		await previous;
		try {
			const records = structuredClone(this.requests);
			await work(records);
			this.requests = structuredClone(records);
		} finally {
			release();
		}
	}
}
