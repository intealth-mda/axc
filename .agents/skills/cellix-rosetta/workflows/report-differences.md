# Report the differences

Compare the object sheet with the repo and tell the user what differs. Stop. Do not write or edit product files.

1. [Read the dictionary](../SKILL.md#read-the-dictionary) by following [excel/read.md](../excel/read.md): contexts, then shape. Read [field-types.md](../field-types.md) so each node is a value object, an entity, or a scalar before you compare.
2. Open the code at the paths in [field-edits.md](../field-edits.md) under "Find the files". Read `<Subdomain>Props`, each nested props interface, and the mongoose schema. The folder context can differ from the Overview header. Use the aggregate that exists. Do not follow "Add", "Remove", or "Change a type".
3. Give the user the mismatch list. Each line is one of: missing in code, extra in code, type differs, nesting differs (`{` versus `[{`, or `_id` present versus absent). Quote the property and both types. An empty list means the sheet and the code agree.

No aggregate anywhere means say so. Do not switch into [New subdomain](new-subdomain.md) unless the user then asks you to build it.
