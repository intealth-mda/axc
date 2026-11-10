// Post-run Cellix compliance report for Task Sets A and B. Not a Stop hook.
// Scores a committed tree (or a git ref) with stable counts you can compare across runs.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LAYERS = ['domain', 'persistence', 'application-services', 'rest'];
const AGGREGATE_FILES = (entity) => [`${entity}.aggregate.ts`, `${entity}.value-objects.ts`, `${entity}.repository.ts`, 'index.ts', `${entity}.aggregate.test.ts`];
/** Context-level passport, visa and domain-permissions files, as upstream Cellix (ocom) places them: contexts/<context>/<context>.<kind>.ts. */
export const isContextAuthFile = (file) => {
	const m = /^packages\/axc\/domain\/src\/domain\/contexts\/([^/]+)\/([^/]+)\.(passport|visa|domain-permissions)\.ts$/.exec(file);
	return Boolean(m && m[1] === m[2]);
};
const INFRA = ['mongoose', 'mongodb', '@cellix/mongoose-seedwork', '@axc/service-mongoose'];
const IMPORT_RULES = [
	{
		name: 'domain imports no delivery, persistence or service code',
		target: 'packages/axc/domain/src',
		banned: ['hono', '@azure/', ...INFRA, '@axc/rest', '@axc/persistence', '@axc/application-services'],
	},
	{
		name: 'REST imports no persistence or infra',
		target: 'packages/axc/rest/src',
		banned: [...INFRA, '@axc/persistence'],
	},
	{
		name: 'application-services imports no infra or HTTP',
		target: 'packages/axc/application-services/src',
		banned: [...INFRA, 'hono', '@axc/rest'],
	},
	{
		name: 'apps/api composition root imports no infra, persistence or HTTP directly',
		target: 'apps/api/src/index.ts',
		banned: ['mongoose', 'mongodb', '@cellix/mongoose-seedwork', '@axc/persistence', '@axc/domain', 'hono', '@azure/functions'],
	},
];

const isTs = (file) => file.endsWith('.ts') && !file.endsWith('.d.ts');
const isIgnoredDomain = (file) => file === 'packages/axc/domain/src/index.ts' || file.startsWith('packages/axc/domain/src/archunit-tests/') || (file.endsWith('.test.ts') && !file.includes('/contexts/'));

export function importSpecifiers(source) {
	return [...source.matchAll(/(?:\bfrom|\bimport|\brequire\(|\bimport\()\s*['"]([^'"]+)['"]/g)].map((match) => match[1] ?? '');
}

function hasSeedArray(text) {
	return /\[[^[\]]*(?:\n[^[\]]*){15,}\]/.test(text);
}

function routeNames(source) {
	return [...source.matchAll(/\bapp\.(?:get|post|put|patch|delete|options|all)\(\s*['"]([^'"]+)['"]/g)].map((match) => match[1]);
}

function filesUnder(files, target) {
	if (target.endsWith('.ts')) return files.has(target) ? [target] : [];
	const prefix = target.endsWith('/') ? target : `${target}/`;
	return [...files.keys()].filter((file) => file === target || file.startsWith(prefix)).filter(isTs);
}

/** @param {Map<string, string>} files repo-relative path → source */
export function assess(files) {
	const shapeGaps = [];
	const entityFolders = new Map();
	const domainFiles = [...files.keys()].filter((file) => file.startsWith('packages/axc/domain/src/') && isTs(file) && !isIgnoredDomain(file));

	for (const file of domainFiles) {
		if (isContextAuthFile(file)) continue;
		const match = /^packages\/axc\/domain\/src\/domain\/contexts\/([^/]+)\/([^/]+)\/([^/]+)$/.exec(file);
		if (match) {
			const key = `${match[1]}/${match[2]}`;
			const names = entityFolders.get(key) ?? new Set();
			names.add(match[3]);
			entityFolders.set(key, names);
			continue;
		}
		const inferred = /^packages\/axc\/domain\/src\/domain\/([^/]+)\/([^/]+)\.ts$/.exec(file);
		if (inferred) {
			const [, context, entity] = inferred;
			const base = `packages/axc/domain/src/domain/contexts/${context}/${entity}/`;
			shapeGaps.push(`${file} — must live under ${base} as ${AGGREGATE_FILES(entity).join(', ')}`);
			continue;
		}
		shapeGaps.push(
			`${file} — domain implementation must live under packages/axc/domain/src/domain/contexts/<context>/<entity>/ (only <context>.passport.ts, <context>.visa.ts and <context>.domain-permissions.ts may sit in contexts/<context>/)`,
		);
	}

	for (const [key, names] of entityFolders) {
		const entity = key.split('/')[1];
		const base = `packages/axc/domain/src/domain/contexts/${key}/`;
		for (const name of AGGREGATE_FILES(entity)) {
			if (names.has(name)) continue;
			shapeGaps.push(`${base}${name}`);
		}
	}

	const layersPresent = LAYERS.filter((layer) =>
		[...files.keys()].some((file) => file.startsWith(`packages/axc/${layer}/src/`) && isTs(file) && !file.endsWith('.test.ts') && !file.includes('/archunit-tests/') && file !== `packages/axc/${layer}/src/index.ts`),
	);
	const hasFeature = entityFolders.size > 0 || domainFiles.length > 0;
	if (hasFeature) {
		const missingLayers = LAYERS.filter((layer) => !layersPresent.includes(layer));
		if (missingLayers.length) shapeGaps.push(`layers not present: ${missingLayers.join(', ')}`);

		const persistenceOutside = [...files.keys()].filter(
			(file) =>
				file.startsWith('packages/axc/persistence/src/') &&
				isTs(file) &&
				!file.includes('/datasources/') &&
				!file.includes('/models/') &&
				!file.endsWith('/index.ts') &&
				!file.endsWith('.test.ts') &&
				!file.includes('/archunit-tests/'),
		);
		for (const file of persistenceOutside) shapeGaps.push(`${file} — persistence implementation must live under src/datasources or src/models`);

		const servicesOutside = [...files.keys()].filter(
			(file) =>
				file.startsWith('packages/axc/application-services/src/') &&
				isTs(file) &&
				!file.includes('/contexts/') &&
				!file.endsWith('/index.ts') &&
				!file.endsWith('.test.ts') &&
				!file.includes('/archunit-tests/') &&
				!file.endsWith('/health.test.ts'),
		);
		for (const file of servicesOutside) shapeGaps.push(`${file} — application-service implementations must live under src/contexts`);
	}

	const restEntry = files.get('packages/axc/rest/src/index.ts') ?? '';
	const routeEntryViolations = routeNames(restEntry)
		.filter((route) => route !== '/health')
		.map((route) => `packages/axc/rest/src/index.ts defines ${route} — move it to packages/axc/rest/src/<feature>.routes.ts`);

	const servicesEntry = files.get('packages/axc/application-services/src/index.ts') ?? '';
	const applicationServicesEntryViolations = [];
	if (/\b\w*(?:fixture|fixtures|seed|sample|mock)\w*\s*(?::[^=]+)?=\s*\[\s*\{/i.test(servicesEntry)) {
		applicationServicesEntryViolations.push('packages/axc/application-services/src/index.ts — move fixture or seed record collections behind a data-source boundary');
	}
	for (const operation of ['filter', 'sort', 'slice']) {
		if (servicesEntry.includes(`.${operation}(`)) {
			applicationServicesEntryViolations.push(`packages/axc/application-services/src/index.ts — move .${operation}() feature behavior into a context operation`);
		}
	}

	const seedArrayViolations = [...files.keys()]
		.filter((file) => file.startsWith('packages/axc/application-services/src/') && isTs(file) && !file.endsWith('.test.ts') && hasSeedArray(files.get(file) ?? ''))
		.map((file) => `${file} — seed or fixture array belongs in persistence, not application services`);

	const importBoundaryViolations = [];
	for (const rule of IMPORT_RULES) {
		for (const file of filesUnder(files, rule.target)) {
			for (const specifier of importSpecifiers(files.get(file) ?? '')) {
				const hit = rule.banned.find((ban) => (ban.endsWith('/') ? specifier.startsWith(ban) : specifier === ban || specifier.startsWith(`${ban}/`)));
				if (hit) importBoundaryViolations.push(`${file} imports '${specifier}' — ${rule.name}`);
			}
		}
	}

	const routeModules = [...files.keys()].filter((file) => /^packages\/axc\/rest\/src\/[^/]+\.routes\.ts$/.test(file)).sort();
	const optional = { uow: 0, visa: 0, passport: 0, domain_permissions: 0 };
	for (const file of files.keys()) {
		if (file.endsWith('.uow.ts')) optional.uow += 1;
		else if (file.endsWith('visa.ts') && file.startsWith('packages/axc/')) optional.visa += 1;
		else if (file.endsWith('passport.ts') && file.startsWith('packages/axc/')) optional.passport += 1;
		else if (file.endsWith('domain-permissions.ts')) optional.domain_permissions += 1;
	}

	const errors = shapeGaps.length + routeEntryViolations.length + importBoundaryViolations.length + applicationServicesEntryViolations.length + seedArrayViolations.length;

	return {
		errors,
		has_feature: hasFeature,
		entities: [...entityFolders.keys()].sort(),
		layers: layersPresent,
		shape_gaps: shapeGaps,
		route_modules: routeModules,
		route_entry_violations: routeEntryViolations,
		import_boundary_violations: importBoundaryViolations,
		application_services_entry_violations: applicationServicesEntryViolations,
		seed_array_violations: seedArrayViolations,
		optional,
	};
}

export function formatReport(result, { ref, json = false } = {}) {
	const body = { ref: ref ?? null, ...result };
	if (json) return `${JSON.stringify(body, null, 2)}\n`;
	const lines = [`cellix-compliance  ref=${ref ?? 'worktree'}  errors=${result.errors}`];
	if (!result.has_feature) lines.push('feature=none');
	else lines.push(`entities=${result.entities.join(',') || '(none)'}`);
	lines.push(`layers=${result.layers.join(',') || '(none)'}`);
	lines.push(`route_modules=${result.route_modules.length}`);
	for (const key of ['shape_gaps', 'route_entry_violations', 'import_boundary_violations', 'application_services_entry_violations', 'seed_array_violations']) {
		const items = result[key];
		lines.push(`${key}=${items.length}`);
		for (const item of items) lines.push(`  ${item}`);
	}
	const { uow, visa, passport, domain_permissions } = result.optional;
	lines.push(`optional  uow=${uow} visa=${visa} passport=${passport} domain_permissions=${domain_permissions}`);
	return `${lines.join('\n')}\n`;
}

export function loadWorktree(root) {
	const files = new Map();
	const roots = ['packages/axc/domain/src', 'packages/axc/persistence/src', 'packages/axc/application-services/src', 'packages/axc/rest/src', 'apps/api/src/index.ts'];
	const walk = (rel) => {
		const abs = path.join(root, rel);
		if (!existsSync(abs)) return;
		if (rel.endsWith('.ts')) {
			if (isTs(rel)) files.set(rel, readFileSync(abs, 'utf8'));
			return;
		}
		for (const entry of readdirSync(abs, { withFileTypes: true })) {
			const next = `${rel}/${entry.name}`;
			if (entry.isDirectory()) walk(next);
			else if (isTs(next)) files.set(next, readFileSync(path.join(root, next), 'utf8'));
		}
	};
	for (const rel of roots) walk(rel);
	return files;
}

export function loadRef(root, ref) {
	const list = spawnSync('git', ['ls-tree', '-r', '--name-only', ref, '--', 'packages/axc/domain/src', 'packages/axc/persistence/src', 'packages/axc/application-services/src', 'packages/axc/rest/src', 'apps/api/src/index.ts'], {
		cwd: root,
		encoding: 'utf8',
	});
	if (list.status !== 0) throw new Error(list.stderr || `git ls-tree failed for ${ref}`);
	const files = new Map();
	for (const file of list.stdout.split('\n').filter(isTs)) {
		const shown = spawnSync('git', ['show', `${ref}:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 20_000_000 });
		if (shown.status !== 0) throw new Error(shown.stderr || `git show failed for ${ref}:${file}`);
		files.set(file, shown.stdout);
	}
	return files;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
	const json = process.argv.includes('--json');
	const refIdx = process.argv.indexOf('--ref');
	const ref = refIdx >= 0 ? process.argv[refIdx + 1] : undefined;
	if (refIdx >= 0 && !ref) {
		console.error('usage: node scripts/cellix-compliance-report.mjs [--ref <git-ref>] [--json]');
		process.exit(2);
	}
	const root = process.cwd();
	const files = ref ? loadRef(root, ref) : loadWorktree(root);
	const result = assess(files);
	process.stdout.write(formatReport(result, { ref: ref ?? currentRef(root), json }));
	process.exit(result.errors === 0 ? 0 : 1);
}

function currentRef(root) {
	const git = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' });
	return git.status === 0 ? git.stdout.trim() : 'worktree';
}
