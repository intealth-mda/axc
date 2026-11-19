---
name: cellix-rosetta
description: >
  Translate a data-dictionary workbook into Cellix subdomain files, and those
  files back into the workbook. Use when the user mentions a data dictionary,
  a Properties column, an xlsx or Google Sheet URL, <project>-system-design,
  or asks to add, remove, change, or validate fields on an aggregate, value
  object, or entity against the sheet, or to add a query, mutation, GraphQL
  field, queue handler, or timer. The workbook may belong to any product
  that uses this sheet layout.
  The agent writes the files.
---

# Cellix rosetta

One job, one workflow. Open that file and follow it. Do not open the other workflow files. `<scope>` and the layer roots come from `factory.json`. Do not assume a product name. Tokens (`<context>`, `<subdomain>`, `<field>`) are filled from the sheet. Their definitions are in [file-tree.md](file-tree.md).

- [new-subdomain](workflows/new-subdomain.md) — build a subdomain that has no aggregate file
- [update-existing-subdomain](workflows/update-existing-subdomain.md) — the aggregate exists; named fields, or the whole sheet, should change the code
- [report-differences](workflows/report-differences.md) — compare the sheet with the repo and report the differences, then stop
- [code-to-sheet](workflows/code-to-sheet.md) — produce a workbook from the code
- [add-graphql-operation](workflows/add-graphql-operation.md) — add one query or mutation the user named, as a GraphQL operation
- [add-queue-operation](workflows/add-queue-operation.md) — add one query or mutation the user named, as a queue handler
- [add-timer-operation](workflows/add-timer-operation.md) — add one query or mutation the user named, as a timer

## Read the dictionary

Every workflow that uses the workbook starts here. The caller passes a local `.xlsx` path. A request that only asks what the sheet contains stops after this section.

Follow [excel/read.md](excel/read.md) through the Excel MCP. Do not read [setup.md](setup.md). That page is for the user. Contexts reads Overview. Each colored column header is a context. Each linked line under it is a subdomain, and the link target is that subdomain's sheet. Shape is one sheet's field tree. The object-sheet read keeps the role letters. Do not save a JSON file.

Writing the workbook follows [excel/write.md](excel/write.md). The file is `<identifier>-system-design-details-output.xlsx`. `<identifier>` is `scope` in `factory.json` with the leading `@` removed. One object, several objects, and the whole repo all write that same workbook: one Overview sheet, then one object sheet per subdomain. It is for [workflows/code-to-sheet.md](workflows/code-to-sheet.md).

A tab with no Properties header is not an object sheet. The `collection:` line is the Mongo collection. It is not `<subdomain>`. An empty line stops the write until the prompt names the collection.

## When the page and the repo disagree

The repo wins for a file that already exists. Add the member in the shape that file uses. The sample on a page is the body of a file that does not exist yet.

A nested file name that is already used in the folder becomes `<parent>-<nested>`. The class becomes `<Parent><Nested>`. A value-object class name that is already exported in the folder becomes `<Nested><Field>`. The subdomain `index.ts` exports each nested class and props type by name. Do not `export *` from two files that declare the same name.

An ObjectId `reference:` whose aggregate exists in the repo is that entity reference plus `load<Field>()`. An ObjectId whose aggregate is not in the repo stays the shape type, `string` or `string | null`, and the mongoose field still has `ref`. Do not invent the missing aggregate.

A nested block the shape marks `null` is `<Nested>Props | null`. The getter returns `null` when the prop is missing. The adapter does not create that subdocument. A nested block that is not null returns `new <Nested>(...)`, and the adapter creates the subdocument when it is missing.

A seed value has to be the prop's type and fit its length. `number | null` is `null`. A string with `maxLength` is a string of that length.

The sheet `collection:` is the mongoose `collection`. The spreadsheet wins over a name already registered on another model. Do not invent a substitute.

## On every code path

A `[{` block with `_id` inside `{` stays on that value object. Role letters, legal columns, and Rules / Notes do not become types. A string with a length or a pattern is a `VOString`. An optional constrained string is `VOOptional` around that `VOString`. A plain string assigns the argument and gets no class. The class body stays empty. Permission checks on setters are not written yet. `isNew` belongs only on the aggregate. `getNewInstance` calls `markAsNew`, then sets root scalars through those setters. An existing aggregate reference may be a parameter. A collection grows with `getNewItem()`. A child that needs a field on another level takes `root`, typed as `I<Subdomain>AggregateRoot extends RootEventRegistry`. The aggregate passes `this`. A parent passes `this.root`. The child uses `this.root.<field>`.

A subdomain named `role`, or whose name ends in `-role`, is not that aggregate. It follows [files/domain/role.aggregate.md](files/domain/role.aggregate.md). It has no `markAsNew`. It creates with `getNewInstance` and `getNewDefault*Instance`, lists the built-in names with `getDefaultRoleNames`, and reassigns with `deleteAndReassignTo`. Updates go through setters. Permission groups are separate `*-permissions.ts` value objects. A closed set of role kinds may extend `VOSet`.

Names: an Overview header is `<context>` in kebab. The linked sheet tab is `<subdomain>`. Both are singular: `harbor`, not `harbors`. A one-word tab stays that word. `itemConfig` becomes `item-config`. A property is `<field>` and `<Field>`. A `|` in a type is quoted when you show it to a person: `"status:'OPEN'|'CLOSED'"`.
