// Hard cap for failure text surfaced to the agent (Stop block reasons, trimmed shell output). Every upstream summary
// has its own limits; this is the last guarantee, so one pathological log (minified bundle, JSON dump, 10k-line
// stack) cannot flood the context. Keeps the head (summaries come first) and the tail (the last error), cuts the middle
// with one marker naming what was dropped and where the full log is, and clips very long lines. Dependency-free.
export const LOG_CAP = { lines: 80, chars: 8000, width: 1000 };

/** `text` within `lines` lines and `chars` characters (marker included); unchanged when it already fits. Pure. */
export function capLog(text, { lines = LOG_CAP.lines, chars = LOG_CAP.chars, width = LOG_CAP.width, log } = {}) {
	const src = String(text ?? '');
	const all = src.split('\n').map((l) => (l.length > width ? `${l.slice(0, width)}… [+${l.length - width} chars]` : l));
	const joined = all.join('\n');
	if (all.length <= lines && joined.length <= chars) return joined;
	const marker = (n) => `… [log cap: ${n} line(s) cut${log ? `; full log: ${log}` : ''}] …`;
	const keep = Math.min(all.length, lines - 1); // about 2/3 head, 1/3 tail
	let head = Math.ceil((keep * 2) / 3);
	let tail = keep - head;
	const build = () => [...all.slice(0, head), marker(all.length - head - tail), ...all.slice(all.length - tail)].join('\n');
	let out = build();
	while (out.length > chars && head + tail > 0) {
		if (tail > 0 && tail * 2 > head) tail--;
		else head--;
		out = build();
	}
	return out.length > chars ? out.slice(0, chars) : out;
}
