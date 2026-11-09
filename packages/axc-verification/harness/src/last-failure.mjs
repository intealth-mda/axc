import { readFileSync, writeFileSync } from 'node:fs';

export function storeFailure(file, { files = [], failure = '' }) {
	writeFileSync(file, `${JSON.stringify({ files, failure })}\n`, 'utf8');
}

export function readFailure(file) {
	try {
		return JSON.parse(readFileSync(file, 'utf8'));
	} catch {
		return { files: [], failure: '' };
	}
}

export function compactNote(stored) {
	const files = stored?.files ?? [];
	const failure = stored?.failure ?? '';
	const fileLine = files.length > 0 ? `Files: ${files.join(', ')}.` : '';
	const failLine = failure ? `Last check: ${failure}` : '';
	return [fileLine, failLine].filter(Boolean).join(' ');
}
