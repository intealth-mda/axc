import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface CellixLintLayers {
	domain: string;
	applicationServices: string;
	persistence: string;
	models: string;
	serviceMongoose: string;
	rest: string;
	graphql: string;
}

export interface CellixLintConfig {
	scope: string;
	layers: CellixLintLayers;
	apiComposition: string;
	acceptance: string;
	hostFunctions: string[];
}

/** Human-owned. `enabled` is the funnel switch. The rest is the layer map lint and generate read. Root wins. */
export const CELLIX_FACTORY_FILES = ['factory.json', '.cellix/factory.json'] as const;

export function defineCellixLint(config: CellixLintConfig): CellixLintConfig {
	return config;
}

export function lintConfigFromFactory(parsed: Partial<CellixLintConfig> & { enabled?: boolean }): CellixLintConfig {
	const defaults = defaultCellixLintConfig();
	const { enabled: _enabled, ...rest } = parsed;
	return { ...defaults, ...rest, layers: { ...defaults.layers, ...rest.layers } };
}

export async function readFactoryFile(root: string): Promise<string | undefined> {
	for (const file of CELLIX_FACTORY_FILES) {
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

export async function loadCellixLintConfig(root: string): Promise<CellixLintConfig> {
	const text = await readFactoryFile(root);
	if (text === undefined) return defaultCellixLintConfig();
	const parsed = JSON.parse(text) as Partial<CellixLintConfig> & { enabled?: boolean };
	return lintConfigFromFactory(parsed);
}

export function defaultCellixLintConfig(): CellixLintConfig {
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
