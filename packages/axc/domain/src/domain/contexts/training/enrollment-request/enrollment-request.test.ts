import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { EnrollmentRequest } from './enrollment-request.aggregate.ts';
import type { EnrollmentRequestProps } from './enrollment-request.entity.ts';
import { assertCreateEnrollment, assertUpdateEnrollment, EnrollmentConflictError, EnrollmentValidationError, enrollmentStatuses } from './enrollment-request.value-objects.ts';

const feature = await loadFeature(path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'features/enrollment-request.feature'));
const input = { courseId: 'course-001', learnerEmail: ' Learner@Example.org ', justification: 'I need this course for my upcoming project.' };
const fresh = () => EnrollmentRequest.getNewInstance({ id: 'enroll-001' } as EnrollmentRequestProps, { visa: {} }, input);
describeFeature(feature, ({ Scenario }) => {
	Scenario('Creation starts pending with an audit entry', ({ When, Then }) => {
		let request: ReturnType<typeof fresh>;
		When('a valid enrollment is constructed', () => {
			request = fresh();
		});
		Then('it is pending with its initial audit entry', () => {
			expect(request.props).toMatchObject({ status: 'pending', learnerEmail: 'learner@example.org', statusHistory: [{ fromStatus: null, toStatus: 'pending', changedBy: 'system', reason: null }] });
			expect(request.props.createdAt).toBe(request.props.updatedAt);
			expect(request.props.statusHistory[0]?.changedAt).toBe(request.props.createdAt);
			expect(new Date(request.props.createdAt).toISOString()).toBe(request.props.createdAt);
		});
	});
	Scenario('Every permitted transition records an audit entry', ({ When, Then }) => {
		const results: EnrollmentRequestProps[] = [];
		When('all permitted transitions are exercised', () => {
			for (const status of ['approved', 'rejected', 'cancelled']) {
				const r = fresh();
				r.updateStatus({ status, changedBy: 'reviewer', reason: 'Prerequisite missing' });
				results.push(structuredClone(r.props));
			}
			const r = fresh();
			r.updateStatus({ status: 'approved', changedBy: 'reviewer' });
			r.updateStatus({ status: 'cancelled', changedBy: 'operator' });
			results.push(r.props);
		});
		Then('their histories retain the actor and reason', () => {
			expect(results.map((r) => r.status)).toEqual(['approved', 'rejected', 'cancelled', 'cancelled']);
			expect(results.map((r) => r.statusHistory.length)).toEqual([2, 2, 2, 3]);
			expect(results[1]?.statusHistory[1]).toMatchObject({ fromStatus: 'pending', toStatus: 'rejected', changedBy: 'reviewer', reason: 'Prerequisite missing' });
			expect(results[3]?.statusHistory[2]).toMatchObject({ fromStatus: 'approved', toStatus: 'cancelled', changedBy: 'operator', reason: null });
			for (const r of results) expect(r.updatedAt).toBe(r.statusHistory.at(-1)?.changedAt);
		});
	});
	Scenario('Forbidden transitions leave the aggregate unchanged', ({ When, Then }) => {
		const attempts: (() => void)[] = [];
		When('every forbidden transition is attempted', () => {
			for (const from of enrollmentStatuses)
				for (const to of enrollmentStatuses) {
					if ((from === 'pending' && to !== 'pending') || (from === 'approved' && to === 'cancelled')) continue;
					attempts.push(() => {
						const r = fresh();
						r.props.status = from;
						const before = structuredClone(r.props);
						expect(() => r.updateStatus({ status: to, changedBy: 'operator', reason: 'Reason' })).toThrow(EnrollmentConflictError);
						expect(r.props).toEqual(before);
					});
				}
		});
		Then('each fails without changing state or history', () => {
			expect(attempts).toHaveLength(12);
			for (const attempt of attempts) attempt();
		});
	});
	Scenario('Inputs are validated at the domain boundary', ({ When, Then }) => {
		const failures: unknown[] = [];
		When('invalid creation and update inputs are used', () => {
			for (const justification of ['', 'x'.repeat(19), 'x'.repeat(501)]) {
				try {
					assertCreateEnrollment({ courseId: '', learnerEmail: 'bad', justification });
				} catch (error) {
					failures.push(error);
				}
			}
			try {
				assertUpdateEnrollment({ status: 'invalid', changedBy: '' });
			} catch (error) {
				failures.push(error);
			}
			try {
				assertUpdateEnrollment({ status: 'rejected', changedBy: 'operator', reason: '  ' });
			} catch (error) {
				failures.push(error);
			}
		});
		Then('all input problems are reported', () => {
			expect(failures).toHaveLength(5);
			for (const error of failures) expect(error).toBeInstanceOf(EnrollmentValidationError);
			expect((failures[0] as EnrollmentValidationError).details.map((d) => d.field)).toEqual(['courseId', 'learnerEmail', 'justification']);
			for (const justification of ['x'.repeat(20), 'x'.repeat(500)]) expect(() => assertCreateEnrollment({ ...input, justification })).not.toThrow();
		});
	});
});
