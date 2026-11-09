import { expect, it } from 'vitest';
import { createDataSources } from '../../../../index.ts';

it('composes initialized unit of work and read repositories over the same store', async () => {
	const sources = createDataSources();
	let id = '';
	await sources.domainDataSource.Training.EnrollmentRequest.EnrollmentRequestUnitOfWork.withScopedTransaction(async (repo) => {
		const item = await repo.getNewInstance('course-001', 'a@b.org', 'x'.repeat(20));
		id = item.id;
		await repo.save(item);
	});
	const read = await sources.readonlyDataSource.Training.EnrollmentRequest.EnrollmentRequestReadRepo.getById(id);
	expect(read?.status).toBe('pending');
	expect(read?.statusHistory[0]?.changedBy).toBe('system');
	const entry = (read?.statusHistory as unknown as { changedBy: string }[])[0];
	if (!entry) throw new Error('Missing history');
	entry.changedBy = 'tamper';
	expect((await sources.readonlyDataSource.Training.EnrollmentRequest.EnrollmentRequestReadRepo.getById(id))?.statusHistory[0]?.changedBy).toBe('system');
	const course = await sources.readonlyDataSource.Training.Course.CourseReadRepo.getById('course-001');
	(course?.tags as string[]).push('tamper');
	expect((await sources.readonlyDataSource.Training.Course.CourseReadRepo.getById('course-001'))?.tags).toEqual(['ai', 'security']);
});
