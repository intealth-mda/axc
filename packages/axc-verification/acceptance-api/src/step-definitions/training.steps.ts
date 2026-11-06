import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Then, When } from '@cucumber/cucumber';
import { actorCalled } from '@serenity-js/core';
import { GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';

interface RequestRecord {
	id: string;
	status: string;
	statusHistory: Array<{ fromStatus: string | null; toStatus: string; changedBy: string; reason: string | null }>;
}

When('the client completes the training enrollment workflow', async () => {
	const actor = actorCalled('Training learner');
	await actor.attemptsTo(Send.a(GetRequest.to('/api/courses?q=security&modality=online&status=active')));
	assert.equal(await actor.answer(LastResponse.status()), 200);
	const courses = await actor.answer(LastResponse.body<{ items: Array<{ id: string }> }>());
	assert.deepEqual(
		courses.items.map((course) => course.id),
		['course-001', 'course-006', 'course-012'],
	);
	const command = { courseId: 'course-001', learnerEmail: `acceptance-${randomUUID()}@example.org`, justification: 'I need this course for upcoming secure development work.' };
	await actor.attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with(command)));
	assert.equal(await actor.answer(LastResponse.status()), 201);
	const created = await actor.answer(LastResponse.body<RequestRecord>());
	assert.equal(created.status, 'pending');
	assert.equal(created.statusHistory[0]?.fromStatus, null);
	assert.equal(created.statusHistory[0]?.changedBy, 'system');
	await actor.attemptsTo(Send.a(PostRequest.to('/api/enrollment-requests').with(command)));
	assert.equal(await actor.answer(LastResponse.status()), 409);
	assert.equal((await actor.answer(LastResponse.body<{ error: { code: string } }>())).error.code, 'DUPLICATE_ACTIVE_REQUEST');
	await actor.attemptsTo(Send.a(PatchRequest.to(`/api/enrollment-requests/${created.id}/status`).with({ status: 'approved', changedBy: 'reviewer@example.org' })));
	assert.equal(await actor.answer(LastResponse.status()), 200);
	let updated = await actor.answer(LastResponse.body<RequestRecord>());
	assert.equal(updated.status, 'approved');
	assert.equal(updated.statusHistory.length, 2);
	await actor.attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests?status=approved&courseId=course-001&learnerEmail=${encodeURIComponent(command.learnerEmail)}`)));
	assert.deepEqual(
		(await actor.answer(LastResponse.body<{ items: RequestRecord[] }>())).items.map((item) => item.id),
		[created.id],
	);
	await actor.attemptsTo(Send.a(PatchRequest.to(`/api/enrollment-requests/${created.id}/status`).with({ status: 'cancelled', changedBy: 'reviewer@example.org', reason: 'Schedule changed' })));
	assert.equal(await actor.answer(LastResponse.status()), 200);
	await actor.attemptsTo(Send.a(GetRequest.to(`/api/enrollment-requests/${created.id}`)));
	assert.equal(await actor.answer(LastResponse.status()), 200);
	updated = await actor.answer(LastResponse.body<RequestRecord>());
	assert.equal(updated.status, 'cancelled');
	assert.equal(updated.statusHistory.length, 3);
	assert.deepEqual(
		updated.statusHistory.map((entry) => entry.toStatus),
		['pending', 'approved', 'cancelled'],
	);
	assert.equal(updated.statusHistory[2]?.reason, 'Schedule changed');
});

Then('the composed training workflow has passed', () => {
	// All status, payload, and audit assertions execute in the workflow above.
});
