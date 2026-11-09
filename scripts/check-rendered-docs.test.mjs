// node --test scripts/check-rendered-docs.test.mjs — pure page checks, routing, and the CLI against a fake built site.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { builtPath, pageProblems } from './check-rendered-docs.mjs';

const ok = '<h1>Courses</h1><h2 id="list">List<a href="#list">\u200b</a></h2><pre><code>GET /api/courses</code></pre>';

test('page renders as written → no problems (anchors, zero-width chars, entities ignored)', () => {
	assert.deepEqual(pageProblems('# Courses\n\n## List\n\n```http\nGET /api/courses\n```\n', ok), []);
	assert.deepEqual(pageProblems('# A &amp; B', '<h1>A &amp; B</h1>'), []);
});
test('unclosed fence, closing fence with trailing text, missing heading, swallowed code block', () => {
	assert.deepEqual(pageProblems('# Courses\n\n```json\n{}\n', '<h1>Courses</h1><pre>{}</pre>'), ['line 3: code fence never closes (the rest of the page renders as code)']);
	assert.match(pageProblems('# Courses\n\n```json\n{}\n``` The course must exist.\n\n## List\n\n```', '<h1>Courses</h1><pre>…</pre>').join('\n'), /line 5: closing fence has trailing text/);
	assert.deepEqual(pageProblems('# Courses\n\n## List', '<h1>Courses</h1>'), ['heading "List" is missing from the rendered page']);
	assert.deepEqual(pageProblems('# C\n\n```\na\n```\n\n```\nb\n```', '<h1>C</h1><pre>a</pre>'), ['2 code block(s) in the source, 1 rendered']);
});
test('headings inside code blocks and frontmatter do not count; line numbers include frontmatter', () => {
	assert.deepEqual(pageProblems('---\nslug: /\n---\n# Intro\n\n```md\n# not a heading\n```', '<h1>Intro</h1><pre></pre>'), []);
	assert.deepEqual(pageProblems('---\nid: x\n---\n# I\n\n```\nopen', '<h1>I</h1>'), ['line 6: code fence never closes (the rest of the page renders as code)']);
});
test('builtPath: routeBasePath, slug, numeric prefixes, index pages', () => {
	assert.equal(builtPath('healthcheck.md', '# H', ''), path.join('build', 'healthcheck', 'index.html'));
	assert.equal(builtPath('intro.md', '---\nslug: /\n---\n# I', ''), path.join('build', 'index.html'));
	assert.equal(builtPath('api/01-courses.md', '# C'), path.join('build', 'docs', 'api', 'courses', 'index.html'));
	assert.equal(builtPath('api/index.md', '# A', '/'), path.join('build', 'api', 'index.html'));
	assert.equal(builtPath('api/x.md', '---\nslug: renamed\n---\n', ''), path.join('build', 'api', 'renamed', 'index.html'));
});
test('cli: missing rendered page or broken page → exit 1 naming the file; healthy site → exit 0', () => {
	const app = mkdtempSync(path.join(tmpdir(), 'rendered-docs-'));
	try {
		mkdirSync(path.join(app, 'docs'));
		writeFileSync(path.join(app, 'docusaurus.config.ts'), "docs: { routeBasePath: '/' }");
		writeFileSync(path.join(app, 'docs/courses.md'), '# Courses\n\n## List\n\n```http\nGET /api/courses\n```\n');
		const cli = () => spawnSync(process.execPath, [path.join(import.meta.dirname, 'check-rendered-docs.mjs'), app], { encoding: 'utf8' });
		let r = cli();
		assert.equal(r.status, 1);
		assert.match(r.stderr, /courses\.md: no rendered page at build\/courses\/index\.html/);
		mkdirSync(path.join(app, 'build/courses'), { recursive: true });
		writeFileSync(path.join(app, 'build/courses/index.html'), '<h1>Courses</h1>');
		r = cli();
		assert.equal(r.status, 1);
		assert.match(r.stderr, /heading "List" is missing[\s\S]*1 code block\(s\) in the source, 0 rendered/);
		writeFileSync(path.join(app, 'build/courses/index.html'), ok);
		r = cli();
		assert.equal(r.status, 0, r.stderr);
	} finally {
		rmSync(app, { recursive: true, force: true });
	}
});
