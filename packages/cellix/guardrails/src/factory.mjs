// Root factory.json wins. .cellix/factory.json remains until that root file exists.
// A missing file means the funnel is on. Hooks and generate read this. They do not write it.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FACTORY_FILES = ['factory.json', '.cellix/factory.json'];

export function factoryEnabled(workspace) {
	const roots = [];
	if (typeof workspace === 'string' && workspace) roots.push(workspace);
	if (!roots.includes(process.cwd())) roots.push(process.cwd());
	for (const root of roots) {
		for (const file of FACTORY_FILES) {
			try {
				const parsed = JSON.parse(readFileSync(resolve(root, file), 'utf8'));
				if (parsed && typeof parsed === 'object' && 'enabled' in parsed) return parsed.enabled !== false;
			} catch {
				// This location has no factory file. Try the next one.
			}
		}
	}
	return true;
}
