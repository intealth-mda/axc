import { compactNote, readFailure } from './last-failure.mjs';

const file = process.env.CELLIX_LAST_FAILURE;
const note = compactNote(file ? readFailure(file) : { files: [], failure: '' });
process.stdout.write(`${JSON.stringify(note ? { user_message: note } : {})}\n`);
