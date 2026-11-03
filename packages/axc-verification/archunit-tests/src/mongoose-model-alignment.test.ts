import { access, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkModelBarrelFiles, checkModelFileConventions, checkStandaloneModelConventions } from '@cellix/archunit-tests/data-sources-mongoose-models';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const modelsPackage = 'packages/axc/data-sources-mongoose-models';

async function exists(target: string): Promise<boolean> {
	try {
		await access(target);
		return true;
	} catch {
		return false;
	}
}

async function sources(directory: string): Promise<string[]> {
	if (!(await exists(directory))) return [];
	const entries = await readdir(directory, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => (entry.isDirectory() ? sources(path.join(directory, entry.name)) : entry.name.endsWith('.ts') && !/\.(?:test|spec|d)\.ts$/.test(entry.name) ? [path.join(directory, entry.name)] : [])),
	);
	return files.flat();
}

async function modelAlignment(root: string): Promise<string[]> {
	const violations: string[] = [];
	const modelsRoot = path.join(root, modelsPackage);
	const modelFiles = (await sources(path.join(modelsRoot, 'src/models'))).filter((file) => file.endsWith('.model.ts'));
	const featureRoots = ['domain/src/domain/contexts', 'persistence/src/datasources/readonly', 'persistence/src/datasources/domain'];
	const expectedModels = new Set<string>();
	for (const featureRoot of featureRoots) {
		const directory = path.join(root, 'packages/axc', featureRoot);
		for (const file of await sources(directory)) {
			if (!/\.(?:aggregate|read-repository|uow)\.ts$/.test(file)) continue;
			const context = path.relative(directory, file).split(path.sep)[0];
			const entity = path.basename(file).replace(/\.(?:aggregate|read-repository|uow)\.ts$/, '');
			expectedModels.add(`${context}/${entity}.model.ts`);
		}
	}
	for (const model of expectedModels) {
		if (!(await exists(path.join(modelsRoot, 'src/models', model)))) violations.push(`missing storage model: ${model}`);
	}
	if (expectedModels.size === 0 && modelFiles.length === 0) return violations;
	const manifest = path.join(modelsRoot, 'package.json');
	if (!(await exists(manifest))) violations.push('missing models workspace package.json');
	else if (JSON.parse(await readFile(manifest, 'utf8')).name !== '@axc/data-sources-mongoose-models') violations.push('incorrect models workspace package name');
	const entry = path.join(modelsRoot, 'src/index.ts');
	const builder = (await exists(entry)) ? await readFile(entry, 'utf8') : '';
	if (!/export\s+(?:const|function)\s+mongooseContextBuilder\b/.test(builder)) violations.push('missing exported mongooseContextBuilder');
	for (const file of modelFiles) {
		const source = await readFile(file, 'utf8');
		const factory = source.match(/export\s+(?:const|function)\s+(\w+ModelFactory)\b/)?.[1];
		if (factory && !new RegExp(`\\b${factory}\\s*\\(`).test(builder)) violations.push(`unregistered model factory: ${factory}`);
		if (!/new\s+Schema\s*</.test(source)) violations.push(`missing typed schema: ${path.relative(modelsRoot, file)}`);
		if (!(await exists(file.replace(/\.ts$/, '.test.ts')))) violations.push(`missing focused model tests: ${path.relative(modelsRoot, file)}`);
	}
	for (const file of await sources(path.join(modelsRoot, 'src'))) {
		const source = await readFile(file, 'utf8');
		// The reusable Cellix boundary check is scoped to @ocom; cover AXC and relative imports here.
		if (
			/(?:from\s*|import\s*\(\s*|import\s*)['"][^'"]*(?:@axc\/(?:domain|persistence|application-services|rest|service-mongoose)\b|@apps\/api\b|(?:\.\.\/)+(?:domain|persistence|application-services|rest|service-mongoose|apps)\/)/.test(
				source,
			)
		)
			violations.push(`models import an upper layer: ${path.relative(modelsRoot, file)}`);
	}
	for (const layer of ['domain', 'application-services', 'rest']) {
		for (const file of await sources(path.join(root, 'packages/axc', layer, 'src'))) {
			if (/['"]@axc\/data-sources-mongoose-models(?:\/|['"])/.test(await readFile(file, 'utf8'))) violations.push(`${layer} must not import storage models: ${path.relative(root, file)}`);
		}
	}
	const persistenceFiles = await sources(path.join(root, 'packages/axc/persistence/src'));
	const persistenceSources = await Promise.all(persistenceFiles.map((file) => readFile(file, 'utf8')));
	if (!persistenceSources.some((source) => /(?:from\s*|import\s*\(\s*)['"]@axc\/data-sources-mongoose-models(?:\/|['"])/.test(source))) violations.push('persistence must consume the models package');
	return violations;
}

describe('Cellix Mongoose model alignment', () => {
	it('requires storage models, context registration, focused tests and persistence consumption for persisted feature slices', async () => {
		expect(await modelAlignment(projectRoot)).toStrictEqual([]);
	});

	it('applies the reusable Cellix model exports, directory and standalone seedwork conventions', async () => {
		const config = { modelsGlob: '../../axc/data-sources-mongoose-models/src/models/**' };
		expect(await checkModelFileConventions(config)).toStrictEqual([]);
		expect(await checkModelBarrelFiles(config)).toStrictEqual([]);
		expect(await checkStandaloneModelConventions(config)).toStrictEqual([]);
	});

	it('detects missing model exports in a project fixture', async () => {
		const violations = await checkModelFileConventions({ modelsGlob: 'src/fixtures/mongoose-models/**' });
		expect(violations).toHaveLength(3);
		for (const name of ['ModelFactory', 'ModelType', 'ModelName']) expect(violations.some((violation) => violation.includes(name))).toBe(true);
	});

	it('rejects absent query-only models and incomplete command models while accepting composed storage models without a database', async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'axc-model-alignment-'));
		const put = async (file: string, source = '') => {
			const target = path.join(root, file);
			await mkdir(path.dirname(target), { recursive: true });
			await writeFile(target, source);
		};
		try {
			expect(await modelAlignment(root)).toStrictEqual([]);
			await put('packages/axc/domain/src/domain/contexts/learning/course/course.aggregate.ts');
			await put('packages/axc/persistence/src/datasources/domain/learning/enrollment-request/enrollment-request.uow.ts');
			expect(await modelAlignment(root)).toEqual(expect.arrayContaining(['missing storage model: learning/course.model.ts', 'missing storage model: learning/enrollment-request.model.ts']));
			await put(`${modelsPackage}/package.json`, JSON.stringify({ name: '@axc/data-sources-mongoose-models' }));
			for (const [entity, name] of [
				['course', 'Course'],
				['enrollment-request', 'EnrollmentRequest'],
			]) {
				await put(
					`${modelsPackage}/src/models/learning/${entity}.model.ts`,
					`export interface ${name} extends MongooseSeedwork.Base {}\nconst schema = new Schema<${name}>({});\nexport const ${name}ModelName = '${name}';\nexport const ${name}ModelFactory = MongooseSeedwork.modelFactory<${name}>(${name}ModelName, schema);\nexport type ${name}ModelType = ReturnType<typeof ${name}ModelFactory>;`,
				);
				await put(`${modelsPackage}/src/models/learning/${entity}.model.test.ts`);
			}
			expect(await modelAlignment(root)).toEqual(expect.arrayContaining(['missing exported mongooseContextBuilder', 'unregistered model factory: CourseModelFactory', 'persistence must consume the models package']));
			await put(`${modelsPackage}/src/index.ts`, 'export const mongooseContextBuilder = (service) => ({ Course: CourseModelFactory(service), EnrollmentRequest: EnrollmentRequestModelFactory(service) });');
			await put('packages/axc/persistence/src/index.ts', "import type { Course } from '@axc/data-sources-mongoose-models/models/learning/course.model.ts';");
			expect(await modelAlignment(root)).toStrictEqual([]);
			await rm(path.join(root, modelsPackage, 'src/models/learning/course.model.test.ts'));
			expect(await modelAlignment(root)).toContain('missing focused model tests: src/models/learning/course.model.ts');
			await put(`${modelsPackage}/src/models/learning/course.model.ts`, "import type { Course } from '@axc/domain';\nexport const CourseModelFactory = MongooseSeedwork.modelFactory('Course', {});");
			expect(await modelAlignment(root)).toEqual(expect.arrayContaining(['missing typed schema: src/models/learning/course.model.ts', 'models import an upper layer: src/models/learning/course.model.ts']));
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});
});
