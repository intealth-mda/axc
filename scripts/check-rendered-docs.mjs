// Rendered docs check (verify, after build): a green Docusaurus build does not prove a page renders as written. A stray
// fence swallows the rest of a page into one code block; a heading can vanish. For every page under apps/docs/docs it
// checks the built HTML: the page exists, every fence closes, every source heading renders (in order), and no code
// block went missing. Dependency-free. Usage: node scripts/check-rendered-docs.mjs [docsAppDir]
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const text = (s) =>
	s
		.replace(/<[^>]*>/g, '')
		.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&#x27;/g, "'")
		.replace(/[\u200b*_`]/g, '')
		.replace(/\s+/g, ' ')
		.trim();

const frontmatter = (md) => /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(md);
const field = (fm, key) => new RegExp(`^${key}:\\s*['"]?([^'"\\r\\n]*?)['"]?\\s*$`, 'm').exec(fm ?? '')?.[1];

/** Source vs rendered HTML for one page → problem strings (empty = renders as written). Pure. */
export function pageProblems(markdown, html) {
	const problems = [];
	const headings = [];
	let fence;
	let blocks = 0;
	const fm = frontmatter(markdown);
	const body = fm ? markdown.slice(fm[0].length) : markdown;
	const offset = fm ? fm[0].split('\n').length - 1 : 0;
	for (const [i, line] of body.split(/\r?\n/).entries()) {
		const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
		if (marker) {
			const [, ticks, rest] = marker;
			if (!fence) fence = { char: ticks[0], len: ticks.length, line: i + 1 + offset, lang: rest.trim() };
			else if (ticks[0] === fence.char && ticks.length >= fence.len) {
				if (rest.trim()) problems.push(`line ${i + 1 + offset}: closing fence has trailing text (it does not close the block)`);
				else {
					if (!/^mermaid\b/.test(fence.lang)) blocks++;
					fence = undefined;
				}
			}
			continue;
		}
		if (!fence) {
			const h = /^ {0,3}#{1,6}[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/.exec(line);
			if (h) headings.push(text(h[1].replace(/\s*\{#[\w-]+\}\s*$/, '')));
		}
	}
	if (fence) problems.push(`line ${fence.line}: code fence never closes (the rest of the page renders as code)`);
	const rendered = [...html.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/g)].map((m) => text(m[1]));
	let next = 0;
	for (const h of headings) {
		const at = rendered.indexOf(h, next);
		if (at < 0) problems.push(`heading "${h}" is missing from the rendered page`);
		else next = at + 1;
	}
	const pres = (html.match(/<pre\b/g) ?? []).length;
	if (pres < blocks) problems.push(`${blocks} code block(s) in the source, ${pres} rendered`);
	return problems;
}

/** Built HTML path for a doc (Docusaurus routing: routeBasePath, slug, numeric prefixes, index/README). Pure. */
export function builtPath(relativePath, markdown, routeBase = 'docs') {
	const slug = field(frontmatter(markdown)?.[1], 'slug');
	const segs = relativePath
		.replace(/\.mdx?$/, '')
		.split('/')
		.map((s) => s.replace(/^\d+-/, ''));
	if (/^(index|readme)$/i.test(segs.at(-1) ?? '')) segs.pop();
	let route = segs.join('/');
	if (slug !== undefined) route = slug.startsWith('/') ? slug.slice(1) : [...segs.slice(0, -1), slug].join('/');
	const parts = [routeBase.replace(/^\/|\/$/g, ''), route.replace(/^\/|\/$/g, '')].filter(Boolean);
	return path.join('build', ...parts, 'index.html');
}

function pages(dir, prefix = '') {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? pages(path.join(dir, e.name), `${prefix}${e.name}/`) : /\.mdx?$/.test(e.name) ? [`${prefix}${e.name}`] : []));
}

/** Every page of a docs app → `file: problem` lines. */
export function checkDocsApp(app) {
	const docs = path.join(app, 'docs');
	if (!existsSync(docs)) return [];
	let config = '';
	try {
		config = readFileSync(path.join(app, 'docusaurus.config.ts'), 'utf8');
	} catch {}
	const routeBase = /routeBasePath:\s*['"]([^'"]*)['"]/.exec(config)?.[1] ?? 'docs';
	const out = [];
	for (const rel of pages(docs)) {
		const md = readFileSync(path.join(docs, rel), 'utf8');
		const built = builtPath(rel, md, routeBase);
		const file = `${path.relative(process.cwd(), docs) || 'docs'}/${rel}`;
		if (!existsSync(path.join(app, built))) {
			out.push(`${file}: no rendered page at ${built} (did the docs build run?)`);
			continue;
		}
		for (const p of pageProblems(md, readFileSync(path.join(app, built), 'utf8'))) out.push(`${file}: ${p}`);
	}
	return out;
}

// realpath + file URL: a symlinked or space-containing path must still run main, not no-op.
const isMain = () => Boolean(process.argv[1]) && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
if (isMain()) {
	const app = path.resolve(process.argv[2] ?? path.join(import.meta.dirname, '../apps/docs'));
	const problems = checkDocsApp(app);
	if (problems.length) {
		console.error(`rendered docs check failed: ${problems.length} problem(s)\n${problems.join('\n')}`);
		process.exit(1);
	}
	console.log('rendered docs: every page built; fences, headings and code blocks render as written');
}
