// node --test scripts/cellix-shape.test.mjs — scope, exemptions and the two shape rules.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hasRuntimeCode, shapeProblems } from './cellix-shape.mjs';

const D = 'packages/axc/domain/src/domain/contexts/catalog/course';
const files = (map) => ({ exists: (f) => f in map, read: (f) => map[f] });

test('new aggregate module without test or index → one problem each, naming the paths to add', () => {
	const tree = { [`${D}/course.ts`]: 'export class Course {}' };
	assert.deepEqual(shapeProblems([`${D}/course.ts`], files(tree)), [`cellix  ${D}/course.ts — add its colocated unit test ${D}/course.test.ts`, `cellix  ${D}/ — add ${D}/index.ts exporting the aggregate's public surface`]);
});
test('test and index present (added now or already on disk) → ok; versioned sub-folders work too', () => {
	const tree = { [`${D}/course.ts`]: 'export class Course {}', [`${D}/course.test.ts`]: '', [`${D}/index.ts`]: '' };
	assert.deepEqual(shapeProblems([`${D}/course.ts`, `${D}/course.test.ts`, `${D}/index.ts`], files(tree)), []);
	assert.deepEqual(shapeProblems([`${D}/course.ts`], files(tree)), []);
	const v = `${D}/v1`;
	assert.deepEqual(shapeProblems([`${v}/course.ts`], files({ [`${v}/course.ts`]: 'export const make = () => 1;' })).length, 2);
});
test('never blocks: REST/app-services/persistence files, edits outside domain contexts, context-level and exempt files, type-only modules', () => {
	const tree = {
		'packages/axc/rest/src/courses.ts': 'export const route = 1;',
		'packages/axc/application-services/src/contexts/catalog/course/query.ts': 'export function q() {}',
		'packages/axc/domain/src/domain/contexts/catalog/catalog.passport.ts': 'export class P {}',
		[`${D}/course.repository.ts`]: 'export interface CourseRepository {}',
		[`${D}/course.uow.ts`]: 'export interface CourseUnitOfWork {}',
		[`${D}/course.types.ts`]: 'export type Id = string;\nexport interface Props { id: Id; f: () => void }',
		[`${D}/index.ts`]: "export * from './course.ts';",
		[`${D}/features/course.feature`]: 'Feature: x',
	};
	assert.deepEqual(shapeProblems(Object.keys(tree), files(tree)), []);
	assert.deepEqual(shapeProblems([], files({})), []);
});
test('hasRuntimeCode: declarations count; types, interfaces and comments do not', () => {
	assert.equal(hasRuntimeCode('export const a = 1;'), true);
	assert.equal(hasRuntimeCode('export default class X {}'), true);
	assert.equal(hasRuntimeCode('export type F = () => void;\ninterface I {}'), false);
	assert.equal(hasRuntimeCode('// const x = 1\n/* class Y {} */\nexport type T = 1;'), false);
});
