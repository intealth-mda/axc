import { expect, it } from 'vitest';
import { EnrollmentStatus, Justification, LearnerEmail } from './enrollment-request.value-objects.ts';

it.each(['pending', 'approved', 'rejected', 'cancelled'])('accepts status %s', (value) => expect(new EnrollmentStatus(value).value).toBe(value));
it.each(['', 'other', null, 1])('rejects invalid status %s', (value) => expect(() => new EnrollmentStatus(value)).toThrow());
it('normalizes learner email', () => expect(new LearnerEmail(' Learner@Example.org ').value).toBe('learner@example.org'));
it.each(['bad', 'a@b', 'a@@b.com', 'a b@c.com', null, 1])('rejects invalid email %s', (value) => expect(() => new LearnerEmail(value)).toThrow());
it.each([20, 500])('accepts justification boundary %s', (length) => expect(new Justification('x'.repeat(length)).value).toHaveLength(length));
it.each([0, 19, 501])('rejects justification length %s', (length) => expect(() => new Justification('x'.repeat(length))).toThrow());
