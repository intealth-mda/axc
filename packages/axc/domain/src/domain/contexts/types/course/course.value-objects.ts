import { VOArray, VOString } from '@lucaspaganini/value-objects';

export class Title extends VOString({
	trim: true,
	minLength: 1,
	maxLength: 100,
}) {}

export class Summary extends VOString({
	trim: true,
	minLength: 1,
	maxLength: 500,
}) {}

export class Modality extends VOString({
	trim: true,
	minLength: 1,
	maxLength: 9,
}) {}

export class Status extends VOString({
	trim: true,
	minLength: 1,
	maxLength: 7,
}) {}

export class Tag extends VOString({
	trim: true,
	minLength: 1,
	maxLength: 50,
}) {}

export class Tags extends VOArray(Tag, {
	minLength: 0,
	maxLength: 20,
}) {}

export const courseModalities = ['online', 'in-person', 'hybrid'] as const;
export const courseStatuses = ['draft', 'active', 'retired'] as const;

export function isCourseModality(value: string): value is (typeof courseModalities)[number] {
	return (courseModalities as readonly string[]).includes(value);
}

export function isCourseStatus(value: string): value is (typeof courseStatuses)[number] {
	return (courseStatuses as readonly string[]).includes(value);
}
