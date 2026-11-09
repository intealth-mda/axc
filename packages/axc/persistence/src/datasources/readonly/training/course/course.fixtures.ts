import type { CourseRecord } from '@axc/data-sources-mongoose-models';
import { Course } from '@axc/domain';

const rows = [
	['AI Security Foundations', 'Secure AI-assisted development', 'online', 'active', ['ai', 'security']],
	['Secure Systems', 'Security practices for teams', 'in-person', 'active', ['security']],
	['AI Security Preview', 'Future security techniques', 'online', 'draft', ['ai', 'security']],
	['Cloud Fundamentals', 'Infrastructure introduction', 'online', 'active', ['cloud']],
	['Legacy Security', 'Retired security methods', 'hybrid', 'retired', ['security']],
	['Applied AI', 'Machine learning introduction', 'hybrid', 'active', ['ai']],
	['Data Modeling', 'Design reliable records', 'in-person', 'draft', ['data']],
	['API Design', 'Practical security for APIs', 'online', 'active', ['api']],
	['Team Leadership', 'Working in groups', 'in-person', 'active', ['teams']],
	['Testing Workshop', 'Quality engineering', 'hybrid', 'active', ['testing']],
	['Old Cloud', 'Historical infrastructure', 'online', 'retired', ['cloud']],
	['Risk Analysis', 'Operational resilience', 'hybrid', 'active', ['security']],
] as const;
export const courseFixtures = (): CourseRecord[] =>
	rows.map((row, index) => {
		const props: CourseRecord = {
			id: `course-${String(index + 1).padStart(3, '0')}`,
			title: row[0],
			summary: row[1],
			modality: row[2],
			status: row[3],
			tags: [...row[4]],
			createdAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
			updatedAt: new Date(Date.UTC(2026, 5, 12 - index)).toISOString(),
		};
		return { ...Course.getNewInstance(props).props };
	});
