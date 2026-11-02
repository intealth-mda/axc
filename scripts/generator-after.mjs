// This repo runs the lint check and session narrowing after generate.
// The generator package does not import those packages. A repo without this file still generates.
import path from 'node:path';
import { readsForEdit, writesForEdit } from '../packages/cellix/generator/src/edit-targets.ts';
import { factoryEnabled, recordingAgentId, recordSession } from '../packages/cellix/guardrails/src/index.mjs';
import { checkCellixLint } from '../packages/cellix/lint/src/index.ts';

export function recordGeneratedSession(options) {
	if (!factoryEnabled(options.root)) return;
	const id = recordingAgentId(options.root);
	if (!id) return;
	recordSession(options.root, id, { read: readsForEdit(options), write: writesForEdit(options) });
}

export async function afterGenerate(options, files) {
	recordGeneratedSession(options);
	const written = files.map((file) => file.path.split(path.sep).join('/'));
	return (await checkCellixLint({ root: options.root, lint: options.lint })).filter((violation) => written.some((file) => violation.includes(file)));
}
