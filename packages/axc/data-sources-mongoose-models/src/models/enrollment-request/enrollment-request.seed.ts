/** Insert enrollmentRequestSeed into the EnrollmentRequest collection. One object is the example. A catalog task adds the other rows to this array. Start the application and read them back through the endpoint. Do not copy this document into a handler, a read repository, or an in-memory catalog. */
export const enrollmentRequestSeed = [
	{
		_id: '000000000000000000000001',
		schemaVersion: '1.0.0',
		version: 0,
		courseId: '000000000000000000000002',
		learnerEmail: 'learner@example.org',
		justification: 'Example justification',
		status: 'pending',
		statusHistory: [{ fromStatus: null, toStatus: 'pending', changedAt: '2026-06-27T10:00:00.000Z', changedBy: 'system', reason: null }],
		createdAt: new Date('2024-01-01T00:00:00.000Z'),
		updatedAt: new Date('2024-01-01T00:00:00.000Z'),
	},
];
// collection.insertMany(enrollmentRequestSeed as unknown as Parameters<typeof collection.insertMany>[0])
