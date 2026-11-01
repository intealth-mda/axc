import { fileURLToPath } from 'node:url';
import { nodeConfig } from '@cellix/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
	nodeConfig,
	defineConfig({
		// Resolve the workspace dependency from source so REST tests do not need application-services built first.
		resolve: { alias: { '@axc/application-services': fileURLToPath(new URL('../application-services/src/index.ts', import.meta.url)) } },
	}),
);
