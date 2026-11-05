import { VOString } from '@lucaspaganini/value-objects';

export class CourseId extends VOString({
	trim: true,
	minLength: 1,
	maxLength: 200,
}) {}
export class LearnerEmail extends VOString({
	trim: true,
	minLength: 1,
	maxLength: 200,
}) {}
export class Justification extends VOString({
	trim: true,
	minLength: 20,
	maxLength: 500,
}) {}
