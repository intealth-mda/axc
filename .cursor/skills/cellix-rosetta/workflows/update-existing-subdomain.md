# Update an existing subdomain

Change an aggregate that already exists so it matches the sheet. Do not write a second aggregate, and do not replace a file with a fresh template. Leave a getter that is not on a props interface. A request to list the differences and stop is [Report the differences](report-differences.md).

1. [Read the dictionary](../SKILL.md#read-the-dictionary) by following [excel/read.md](../excel/read.md): contexts, then shape. Read [field-types.md](../field-types.md) so each node is a value object, an entity, or a scalar.
2. Open the code at the paths in [field-edits.md](../field-edits.md) under "Find the files". Read `<Subdomain>Props`, each nested props interface, and the mongoose schema. The folder context can differ from the Overview header. Use the aggregate that exists. The table "Where a field lives" names the props, getter, mongoose field, seed key, and adapter member.
3. The user named the fields: edit those declarations only. The user asked to match the sheet: list every mismatch first. Each line is one of: missing in code, extra in code, type differs, nesting differs (`{` versus `[{`, or `_id` present versus absent). Quote the property and both types. The sheet wins.
4. Apply the edit with the "Add", "Remove", and "Change a type" sections of [field-edits.md](../field-edits.md). Open a `files/` page from [file-tree.md](../file-tree.md) only when a file is missing.
5. After a whole-sheet match, compare again. Stop when the list is empty. Tell the user what changed.

No aggregate anywhere means this is [New subdomain](new-subdomain.md).
