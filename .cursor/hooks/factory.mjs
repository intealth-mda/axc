// Hooks read the factory file. They do not write it.
// Root factory.json wins. .cellix/factory.json is the fallback while that file is still there.
import { readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';

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

export function isFactoryFile(file, workspace = process.cwd()) {
	if (typeof file !== 'string' || file.length === 0 || file.includes('\n')) return false;
	const absolute = isAbsolute(file) ? file : resolve(workspace, file);
	const relativePath = relative(workspace, absolute).split(sep).join('/');
	return relativePath === 'factory.json';
}
