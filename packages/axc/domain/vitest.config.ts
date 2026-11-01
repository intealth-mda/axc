import { nodeConfig } from '@cellix/config-vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
	nodeConfig,
	defineConfig({
		// No tests exist in this package yet; keep `pnpm test` green until they do.
		test: { passWithNoTests: true },
	}),
);
