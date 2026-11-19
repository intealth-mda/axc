# Read the dictionary through the Excel MCP

This page reads the dictionary through the `excel` MCP server. Do not save the JSON to a file. Print it, then continue the workflow.

The server reads a local `.xlsx`. A Google Sheet or SharePoint URL has to be a local workbook before these calls. Pass that path to every tool. The examples say `filepath`; the connected server uses `path`. If a parameter name differs, map the value onto the live name. Do not drop a value because the key differs.

## List the tabs

List the sheet tabs.

```text
describe_workbook({ "filepath": "<workbook>" })
```

The sheet names are the result. `Overview` is not an object sheet.

## Contexts

Read the Overview sheet.

```text
describe_sheet({ "filepath": "<workbook>", "sheet_name": "Overview" })
read_range({ "filepath": "<workbook>", "sheet_name": "Overview", "start_cell": "A1", "end_cell": "AZ40" })
```

Widen the range until every card is included. Read the hyperlinks on that sheet. A link whose target is `'dock'!A1` or `#dock!A1` points at the sheet tab `dock`.

Find the header row: the lowest row that has text and sits above the first link. Each non-empty cell on that row is a context title. A link belongs to the nearest header at or left of the link's column, in the same way a rail sits left of its content column.

Emit:

```json
{
  "contexts": [
    {
      "context": "harbor",
      "title": "Harbor",
      "subdomains": [
        { "subdomain": "dock", "title": "Dock", "sheet": "dock" }
      ]
    }
  ]
}
```

`context` and `subdomain` are kebab-case. A header `Item Detail` is `item-detail`. A tab that is already one word stays that word. A camelCase tab `itemDetail` is `item-detail`. No Overview sheet emits `{ "contexts": [] }`.

## One object sheet

Read one object sheet.

```text
read_range({ "filepath": "<workbook>", "sheet_name": "dock", "start_cell": "A1", "end_cell": "AZ400" })
```

Page until column A is empty after the last property. A sheet whose column A never says `Properties` is not an object sheet. Stop. Overview is one of those.

Find the header row, the row whose column A is `Properties`. The tail headers on that row, matched ignoring case, are:

| Header | JSON key |
| --- | --- |
| `DataType` | `dataType` |
| `Recommended Datatype` | `recommended` |
| `Rules / Notes` | `rules` |
| `Legal Review Classification` | `legalClassification` |
| `Legal Review Reason` | `legalReason` |

`DataType` has to be there. `Recommended Datatype` may be absent. Read the columns that exist.

`collection` is the text after `collection:` in column A above the header. `title` is column A on the row above the header, or the sheet name when that cell is empty.

Role columns sit between column B and the first tail column. When the Properties row names the roles, the row above names the states, and a new state starts a new group. When the Properties row is blank under those columns, the row above holds the role names as one group. Letters are `C`, `R`, `U`, `X`, or blank. A blank letter is omitted. These letters are not permissions.

Each row under the header with any text or any letter becomes:

```json
{
  "property": "<column A>",
  "access": { "<state>": { "<role>": "C" } },
  "dataType": "",
  "recommended": "",
  "rules": "",
  "legalClassification": "",
  "legalReason": ""
}
```

Emit `{ "sheet", "collection", "title", "matrixLabel", "states", "rows" }`. `matrixLabel` is column B two rows above the Properties header. `states` is `[{ "name", "roles" }]`.

## Shape

Build the field tree from the object-sheet JSON above. Walk `rows` from top to bottom. Leave `rows` and `states` out of this result.

| Column A | What it does |
| --- | --- |
| `<field>` | A field |
| `<field> []` | An array of scalars. The item type is in DataType |
| `<nested> {` | Open a value object. Close with `}` |
| `<child> [{` | Open a collection. Close with `}]` |
| `_id`, or `id` whose DataType head is `objectid`, inside an open block | Marks that block as an entity. It is not a field |
| `}` or `}]` | Close the innermost open block |
| `schemaVersion`, `createdAt`, `updatedAt` | Skip. They are not fields |

A `[{` block with `_id` is an entity. A `[{` block without `_id` is a value-array. A `{` block is a value. A collection inside an object stays inside that object.

DataType clauses are separated by `;`. The first word is the head. `optional` makes the type end in `|null`. `optional in storage` is optional. `required by <nested> input` does not override `optional`.

| Head | Type |
| --- | --- |
| `string`, `number`, `boolean` | that word |
| `date`, `timestamp` | `date` |
| `ObjectId` | `string`, and `constraints.storage` is `ObjectId` |
| `array` | `<item>[]` from `item type:`. No item type means `string[]` |
| `accepted values: Open, Closed` | `'Open'|'Closed'` when every token is a single word and the list is not described as list, current, runtime, seeded, or no schema |

`reference: <Other>` on an ObjectId becomes `constraints.reference`. From Recommended Datatype and DataType, copy `length` (sets both min and max), `minLength`, `maxLength`, `pattern`, `trim`, and `unique` into `constraints`.

A field node is `{ "node": "field", "name", "property", "type", "voString", "dataType", "recommended", "rules", "legalClassification", "legalReason", "constraints" }`. `voString` is true when `type` is `string`. A nested node is `{ "node": "nested", "property", "kebab", "kind", "members", ...the row text }`. `kind` is `entity`, `value-array`, or `value`.

Look up the sheet on the contexts result. When the tab matches, set `context`, `contextTitle`, `subdomain`, and `subdomainTitle`. Otherwise `context` is null and `subdomain` is the kebab of the sheet name.

Shape emits `sheet`, `collection`, `title`, `subdomain`, `context`, `contextTitle`, `subdomainTitle`, `fields`, `nested`, `warnings`. An unclosed block or an object written without a brace is a warning string, not a crash.
