# Sheet layout

Object sheets use one layout. [excel/read.md](excel/read.md) reads it and [excel/write.md](excel/write.md) writes it. Do not parse the xlsx by hand.

## Header

A sheet with a role matrix uses three rows under an optional navigation row. A sheet written from code has no role matrix yet, so it does not write `Role`, `State / Role`, or an empty role column. The tail columns start in column B.

| Row | Column A | The rest, when there is no role matrix |
| --- | --- | --- |
| Collection | `collection:<mongo name>`, bold italic 12pt | empty |
| Title | Display name, bold 24pt | empty |
| Header | `Properties`, bold 12pt | `DataType`, `Recommended Datatype`, `Rules / Notes`, `Legal Review Classification`, `Legal Review Reason` |

Do not put the title on a row above the collection line. Column A is wide enough for the property names. `DataType` and `Recommended Datatype` are wide enough for the whole cell.

When a role matrix is present, the collection row says `State / Role`, the title row names each state, and the Properties row names the roles before those same tail columns. Some sheets put the role names on the title row and leave the Properties row blank under them. [excel/read.md](excel/read.md) already reads that. `Recommended Datatype` is absent on some sheets. Read whichever tail columns exist.

The first property rows are `_id`, then `schemaVersion`. They come from the mongoose model. Domain fields follow. `createdAt` and `updatedAt` stay at the end.

## Overview

The colored column header is a context. Each linked line under that header is a subdomain of that context. The link target is the object sheet. Several lines under one header are several subdomains. The contexts section of [excel/read.md](excel/read.md) prints the pair. The header supplies `<context>`. The sheet tab supplies `<subdomain>`. A header with a space or a capital (`Item Detail`) is context `item-detail`. A tab that is already one word stays that word. A camelCase tab (`itemDetail`) is subdomain `item-detail`.

A sheet written from code uses that same pair, drawn as the dictionary card. Gridlines are off. Column A is a margin, width 6.375. Each context is the next four columns: a rail (3.375), the content column (24.625), a rail (3.375), and a spacer (3.375). The first card starts at column B.

| Row | What is there | Height |
| --- | --- | --- |
| 2 | Cover title, 36pt, with a medium underline through the cards | 48 |
| 4 | `Type Specification Document`, 20pt | 21.95 |
| 6 | Top of the card, filled | 20.1 |
| 7 | Context title, 24pt, in the left rail. A medium underline runs across the card | 27 |
| 8 | Filled rails, white content | 20.1 |
| 9 | First subdomain link, 18pt underlined, in the content column | 27.95 |
| 10, 12–29 | More subdomain links, then empty white content. Row 11 stays a taller gap | 24, and 36.95 on row 11 |
| 30 | Bottom of the card, filled | 20.1 |

The rails and the top and bottom caps share one fill. That fill is the card. Do not stroke a border around it. The only line on the card is the medium underline under the context title, across the rail and the content column. The first four contexts use green `FFC3FFC7`, blue `FFC3D9FF`, peach `FFF8CBAD`, and gray `FFBFBFBF`, then the same four again. The link location is `'<sheet>'!A1` and the visible text is the subdomain title. Further links of that context continue down the content column. One column per context. Do not add contexts that are not in the model, and do not add the type key. `contexts` reads this page back: the header row is the row of context titles, above the first link, and a link belongs to the header in its rail.

A tab with no Properties header is not an object sheet. Do not run the object translation on it.

## Properties

The first column is a tree. Indent is not significant. The suffix is.

| Cell | Meaning |
| --- | --- |
| `<field>` | One field |
| `<field> []` | Array of scalars. The item type is in DataType |
| `<nested> {` | Start a value object. Closed by `}` |
| `<child> [{` | Start a collection. Closed by `}]` |
| `_id` inside `[{` | Identity. The collection is an entity |
| `}` or `}]` | Close the innermost open block |

A collection inside an object stays inside that object:

```text
<nested> {
<field>
<child> [{
_id
<field>
}]
}
```

That is `<nested>.<child>`, not a root `<child>` prop.

## DataType

Clauses are separated by `;`. The first word is the head.

| Head | Examples of later clauses |
| --- | --- |
| `string` | `required`, `optional`, `unique`, `accepted values: Open, Closed` |
| `number` | `optional` |
| `boolean` | `optional` |
| `date` | `optional`, calendar-date notes |
| `timestamp` | `optional`, `system-generated`, BSON Date notes |
| `ObjectId` | `required`, `unique`, `reference: <OtherSubdomain>`, `implicit`, `system-generated` |
| `array` | `item type: string`, `item type: object` |
| `object` | `optional`, `embedded object` |

`optional in storage` is optional. `required by <nested> input` does not override `optional`. If both words appear, the field is optional.

Root `_id`, root `schemaVersion`, root `createdAt`, and root `updatedAt` are rows on the sheet and are not fields you declare on the aggregate. Root `_id` and root `schemaVersion` are the first two property rows, taken from the mongoose model. A nested `_id` is the entity marker, not a prop. Nested `createdAt` and `updatedAt` on an entity are the same: the entity template owns them.

## What does not become a type

The letters under each role are `C` create, `R` read, `U` update, `X` hidden, or blank. They describe who can touch the field in a state. They are not permissions, not `canManage`, and not GraphQL nullability. Preserve them when you rewrite a sheet from `read` JSON. When the source is code, leave them blank.

Rules / Notes, Legal Review Classification, and Legal Review Reason travel with the row. They do not change the TypeScript type. Recommended Datatype supplies `trim`, `minLength`, `maxLength`, `length`, and `pattern` for a required string.
