import type { NestedSpec } from './spec.ts';
import type { GenerateFeatureOptions } from './types.ts';

/** The files a person still has to fill in. Barrels are already wired. */
export function filesToEdit(options: GenerateFeatureOptions): string[] {
	const { lint, context, entity, action, operation, transport, resolver } = options;
	const aggregate = `${lint.layers.domain}/domain/contexts/${context}/${entity}/${entity}.aggregate.ts`;
	const seed = `${lint.layers.models}/models/${entity}/${entity}.seed.ts`;
	if (!action) return [aggregate, seed];
	const actionFile = `${lint.layers.applicationServices}/contexts/${context}/${entity}/${action}.ts`;
	const files = [actionFile];
	if (operation === 'query') {
		files.push(`${lint.layers.persistence}/datasources/readonly/${context}/${entity}/${entity}.read-repository.ts`);
	} else {
		files.push(aggregate);
	}
	if (transport === 'rest' && (operation === 'query' || operation === 'update' || options.route)) {
		files.push(`${lint.layers.rest}/index.ts`);
	} else if (resolver === true || transport === 'graphql') {
		files.push(`${lint.layers.graphql}/${entity}.resolvers.ts`);
	}
	if (operation !== 'query') files.push(seed);
	if (lint.acceptance) {
		files.push(`${lint.acceptance}/features/${entity}-${action}.feature`);
		files.push(`${lint.acceptance}/step-definitions/${entity}-${action}.steps.ts`);
	}
	return files;
}

/** Package and slice barrels, plus the mongoose model. The printed edit list stays the behavior files. */
function modelAndBarrels(options: GenerateFeatureOptions): string[] {
	const { lint, context, entity } = options;
	const domain = lint.layers.domain;
	const persistence = lint.layers.persistence;
	const application = lint.layers.applicationServices;
	return [
		`${lint.layers.models}/models/${entity}/${entity}.model.ts`,
		`${lint.layers.models}/index.ts`,
		`${lint.layers.serviceMongoose}/index.ts`,
		`${domain}/index.ts`,
		`${domain}/domain/index.ts`,
		`${domain}/domain/contexts/index.ts`,
		`${domain}/domain/contexts/${context}/index.ts`,
		`${domain}/domain/contexts/${context}/${entity}/index.ts`,
		`${persistence}/index.ts`,
		`${persistence}/datasources/index.ts`,
		`${persistence}/datasources/domain/index.ts`,
		`${persistence}/datasources/domain/${context}/index.ts`,
		`${persistence}/datasources/domain/${context}/${entity}/index.ts`,
		`${persistence}/datasources/readonly/index.ts`,
		`${persistence}/datasources/readonly/${context}/index.ts`,
		`${persistence}/datasources/readonly/${context}/${entity}/index.ts`,
		`${application}/index.ts`,
		`${application}/contexts/${context}/index.ts`,
		`${application}/contexts/${context}/${entity}/index.ts`,
		`${domain}/domain/contexts/${context}/${entity}/${entity}.repository.ts`,
		`${domain}/domain/contexts/${context}/${entity}/${entity}.uow.ts`,
		`${persistence}/datasources/domain/${context}/${entity}/${entity}.domain-adapter.ts`,
		`${persistence}/datasources/domain/${context}/${entity}/${entity}.repository.ts`,
		`${persistence}/datasources/domain/${context}/${entity}/${entity}.uow.ts`,
		`${persistence}/datasources/readonly/${context}/${entity}/${entity}.data.ts`,
		`${persistence}/datasources/readonly/${context}/${entity}/${entity}.read-repository.ts`,
		`${domain}/domain/contexts/${context}/${context}.domain-permissions.ts`,
		`${domain}/domain/contexts/${context}/${context}.visa.ts`,
		...nestedPaths(options),
	];
}

function nestedPaths(options: GenerateFeatureOptions): string[] {
	const dir = `${options.lint.layers.domain}/domain/contexts/${options.context}/${options.entity}`;
	const files: string[] = [];
	const walk = (items: readonly NestedSpec[]) => {
		for (const item of items) {
			files.push(`${dir}/${item.name}.value-objects.ts`);
			if (item.kind === 'entity') files.push(`${dir}/${item.name}.entity.ts`);
			walk(item.fields.filter(isNested));
		}
	};
	walk(options.nested ?? []);
	return files;
}

function isNested(member: NestedSpec['fields'][number]): member is NestedSpec {
	return 'fields' in member;
}

/** Files the timed agent may read. Other subdomains, manifests, and tsconfig stay off this list. A failing check names any other file. */
export function readsForEdit(options: GenerateFeatureOptions): string[] {
	const { lint, context, entity } = options;
	const acceptance = lint.acceptance;
	const behavior = [
		`${lint.layers.domain}/domain/contexts/${context}/${entity}/${entity}.value-objects.ts`,
		...(acceptance ? [`${acceptance}/infrastructure.ts`, `${acceptance}/cucumber-lifecycle-hooks.ts`] : []),
		...(lint.apiComposition ? [lint.apiComposition] : []),
		'apps/docs/',
		'.agents/skills/cellix-architecture/',
		'AGENTS.md',
		'.agents/skills/cellix-architecture/SKILL.md',
		'.agents/skills/cellix-architecture/REFERENCE.md',
		'.cellix/factory.json',
	];
	return [...new Set([...filesToEdit(options), ...modelAndBarrels(options), ...behavior])];
}

const INSTRUCTION = new Set(['AGENTS.md', '.agents/skills/cellix-architecture/SKILL.md', '.agents/skills/cellix-architecture/REFERENCE.md', '.cellix/factory.json']);

/** Same slice as the read list. Instruction files stay readable and are not writable. */
export function writesForEdit(options: GenerateFeatureOptions): string[] {
	return readsForEdit(options).filter((entry) => !INSTRUCTION.has(entry) && !(entry.endsWith('/') && entry !== 'apps/docs/'));
}
