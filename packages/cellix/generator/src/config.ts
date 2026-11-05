import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface GenerateLayers {
	domain: string;
	applicationServices: string;
	persistence: string;
	models: string;
	serviceMongoose: string;
	rest: string;
	graphql: string;
}

/** Layer map from factory.json. The generator reads it and does not import the lint package. */
export interface GenerateLayout {
	scope: string;
	layers: GenerateLayers;
	apiComposition: string;
	acceptance: string;
	hostFunctions: string[];
}

const FACTORY_FILES = ['factory.json', '.cellix/factory.json'] as const;

export function defaultGenerateLayout(): GenerateLayout {
	return {
		scope: '@axc',
		layers: {
			domain: 'packages/axc/domain/src',
			applicationServices: 'packages/axc/application-services/src',
			persistence: 'packages/axc/persistence/src',
			models: 'packages/axc/data-sources-mongoose-models/src',
			serviceMongoose: 'packages/axc/service-mongoose/src',
			rest: 'packages/axc/rest/src',
			graphql: 'packages/axc/graphql/src',
		},
		apiComposition: 'apps/api/src/index.ts',
		acceptance: 'packages/axc-verification/acceptance-api/src',
		hostFunctions: ['buildApplicationServicesFactory', 'resolveEnvironment'],
	};
}

function layoutFromFactory(parsed: Partial<GenerateLayout>): GenerateLayout {
	const defaults = defaultGenerateLayout();
	const { enabled: _enabled, ...rest } = parsed as Partial<GenerateLayout> & { enabled?: boolean };
	return { ...defaults, ...rest, layers: { ...defaults.layers, ...rest.layers } };
}

async function readFactoryFile(root: string): Promise<string | undefined> {
	for (const file of FACTORY_FILES) {
		try {
			return await readFile(path.join(root, file), 'utf8');
		} catch {
			// Try the next factory location.
		}
	}
	return undefined;
}

export async function findCellixRoot(start: string): Promise<string> {
	let current = path.resolve(start);
	for (;;) {
		if ((await readFactoryFile(current)) !== undefined) return current;
		const parent = path.dirname(current);
		if (parent === current) return path.resolve(start);
		current = parent;
	}
}

export async function loadGenerateLayout(root: string): Promise<GenerateLayout> {
	const text = await readFactoryFile(root);
	if (text === undefined) return defaultGenerateLayout();
	return layoutFromFactory(JSON.parse(text) as Partial<GenerateLayout>);
}
