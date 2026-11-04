// This repo runs the lint check and session narrowing after generate.
// The generator package does not import those packages. A repo without this file still generates.
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { readsForEdit, writesForEdit } from '../packages/cellix/generator/src/edit-targets.ts';
import { factoryEnabled, recordingAgentId, recordSession } from '../packages/cellix/guardrails/src/index.mjs';
import { checkCellixLint } from '../packages/cellix/lint/src/index.ts';

export function recordGeneratedSession(options) {
	if (!factoryEnabled(options.root)) return;
	const id = recordingAgentId(options.root);
	if (!id) return;
	const seeds = modelSeeds(options);
	recordSession(options.root, id, { read: [...readsForEdit(options), ...seeds], write: [...writesForEdit(options), ...seeds] });
}

/** Every model seed, plus this entity's seed. Read and write both keep that list. */
function modelSeeds(options) {
	const models = options.lint?.layers?.models;
	const found = new Set();
	if (typeof models === 'string' && typeof options.entity === 'string' && options.entity.length > 0) {
		found.add(`${models}/models/${options.entity}/${options.entity}.seed.ts`);
	}
	if (typeof models === 'string' && typeof options.root === 'string') walkSeeds(path.join(options.root, models, 'models'), options.root, found);
	return [...found];
}

function walkSeeds(directory, root, found) {
	let entries = [];
	try {
		entries = readdirSync(directory, { withFileTypes: true });
	} catch {
		return;
	}
	for (const entry of entries) {
		const full = path.join(directory, entry.name);
		if (entry.isDirectory()) walkSeeds(full, root, found);
		else if (entry.name.endsWith('.seed.ts')) found.add(path.relative(root, full).split(path.sep).join('/'));
	}
}

export async function afterGenerate(options, files) {
	recordGeneratedSession(options);
	const written = files.map((file) => file.path.split(path.sep).join('/'));
	return (await checkCellixLint({ root: options.root, lint: options.lint })).filter((violation) => written.some((file) => violation.includes(file)));
}
