import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assess, formatReport, importSpecifiers } from './cellix-compliance-report.mjs';

const complete = () => {
	const files = new Map([
		['packages/axc/domain/src/domain/contexts/catalog/course/course.aggregate.ts', 'export class Course {}\n'],
		['packages/axc/domain/src/domain/contexts/catalog/course/course.value-objects.ts', 'export {}\n'],
		['packages/axc/domain/src/domain/contexts/catalog/course/course.repository.ts', 'export {}\n'],
		['packages/axc/domain/src/domain/contexts/catalog/course/index.ts', 'export {}\n'],
		['packages/axc/domain/src/domain/contexts/catalog/course/course.aggregate.test.ts', 'export {}\n'],
		['packages/axc/domain/src/index.ts', 'export {}\n'],
		['packages/axc/persistence/src/datasources/catalog/course.ts', 'export {}\n'],
		['packages/axc/application-services/src/contexts/catalog/course/index.ts', 'export function createCourseService() {}\n'],
		['packages/axc/application-services/src/index.ts', 'export {}\n'],
		['packages/axc/rest/src/courses.routes.ts', "export function registerCourseRoutes(app) { app.get('/api/courses', () => {}); }\n"],
		['packages/axc/rest/src/index.ts', "import { registerCourseRoutes } from './courses.routes.ts';\nexport function createRestApp(app) { app.get('/health', () => {}); registerCourseRoutes(app); }\n"],
		['apps/api/src/index.ts', "import { restHandlerCreator } from '@axc/rest';\n"],
	]);
	return files;
};

describe('cellix-compliance-report', () => {
	it('scores a complete A/B house shape as 0 errors', () => {
		const result = assess(complete());
		assert.equal(result.errors, 0);
		assert.deepEqual(result.entities, ['catalog/course']);
		assert.deepEqual(result.route_modules, ['packages/axc/rest/src/courses.routes.ts']);
	});

	it('scores an empty baseline as 0 errors with no feature', () => {
		const result = assess(
			new Map([
				['packages/axc/domain/src/index.ts', 'export type {}\n'],
				['packages/axc/domain/src/archunit-tests/domain-conventions.test.ts', 'export {}\n'],
			]),
		);
		assert.equal(result.errors, 0);
		assert.equal(result.has_feature, false);
	});

	it('counts a flat domain file as a shape gap', () => {
		const result = assess(new Map([['packages/axc/domain/src/domain/catalog/course.ts', 'export interface Course {}\n']]));
		assert.ok(result.shape_gaps.some((gap) => /contexts\/catalog\/course/.test(gap)));
		assert.ok(result.errors >= 1);
	});

	it('counts a non-health route in the REST entry point', () => {
		const files = complete();
		files.set('packages/axc/rest/src/index.ts', "export function createRestApp(app) { app.get('/api/courses', () => {}); }\n");
		const result = assess(files);
		assert.equal(result.route_entry_violations.length, 1);
		assert.ok(result.errors >= 1);
	});

	it('counts a banned domain import', () => {
		const files = complete();
		files.set('packages/axc/domain/src/domain/contexts/catalog/course/course.aggregate.ts', "import mongoose from 'mongoose';\nexport class Course {}\n");
		const result = assess(files);
		assert.equal(result.import_boundary_violations.length, 1);
	});

	it('parses static, dynamic and require imports', () => {
		assert.deepEqual(importSpecifiers("import a from 'x';\nimport 'y';\nconst c = await import(\"z\");\nrequire('w');\nexport { d } from './d.ts';"), ['x', 'y', 'z', 'w', './d.ts']);
	});

	it('prints a stable text report', () => {
		const text = formatReport(assess(new Map()), { ref: 'abc123' });
		assert.match(text, /^cellix-compliance  ref=abc123  errors=0$/m);
		assert.match(text, /^feature=none$/m);
	});
});
