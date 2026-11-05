#!/usr/bin/env node
import { checkCellixLint } from './check.js';
import { findCellixRoot, loadCellixLintConfig } from './config.js';

const root = await findCellixRoot(process.cwd());
const lint = await loadCellixLintConfig(root);
const violations = await checkCellixLint({ root, lint });
if (violations.length > 0) {
	console.error(violations.join('\n\n'));
	console.error(`\nCellix lint: ${violations.length} violation${violations.length === 1 ? '' : 's'}`);
	process.exit(1);
}
console.log('Cellix lint: ok');
