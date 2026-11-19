# Write the dictionary through the Excel MCP

This page writes the dictionary through the `excel` MCP server. Do not save a JSON file of the model. The only file is the workbook.

Build the row model the way [workflows/code-to-sheet.md](../workflows/code-to-sheet.md) already does. This page is how those rows become cells. One subdomain, several subdomains, and the whole repo all write one workbook: the Overview sheet first, then one object sheet per subdomain. The sheet tab is the subdomain. Two models must not share a tab.

The server will not overwrite a workbook it did not mean to replace. When the output file already exists, edit that file. Do not call `create_workbook` on it. When it does not exist, create it, then rename the first sheet to `Overview` and add the object sheets.

```text
create_workbook({ "filepath": "<out.xlsx>" })
rename_sheet({ "filepath": "<out.xlsx>", "sheet_name": "Sheet", "new_name": "Overview" })
create_sheet({ "filepath": "<out.xlsx>", "sheet_name": "dock" })
```

`Sheet` is the usual first tab from `create_workbook`. If the tool names it something else, rename the tab that exists. Follow the live parameter names when they differ.

## Object sheet, no role matrix

A sheet written from code has no role columns. Row 1 is the collection line. Do not put the title above it.

```text
write_range({
  "filepath": "<out.xlsx>",
  "sheet_name": "dock",
  "start_cell": "A1",
  "values": [
    ["collection:dock"],
    ["Dock"],
    ["Properties", "DataType", "Recommended Datatype", "Rules / Notes", "Legal Review Classification", "Legal Review Reason"],
    ["_id", "ObjectId; required; unique; system-generated", "", "", "", ""],
    ["schemaVersion", "string; default: 1.0.0; system-populated", "", "", "", ""]
  ]
})
```

Then one row per field, in path order. Then `createdAt` and `updatedAt`. Then anything the model lists after the timestamps.

| Column A | Meaning |
| --- | --- |
| `<field>` | One field |
| `<field> []` | Array of scalars |
| `<nested> {` | Value object, later closed with `}` |
| `<child> [{` | Collection, later closed with `}]` |
| `_id` inside `[{` | Entity marker |
| `}` or `}]` | Close the innermost block |

Column B is DataType, C Recommended Datatype, D Rules / Notes, E Legal Review Classification, F Legal Review Reason. Leave a role letter blank. Do not invent `C`, `R`, `U`, or `X`. Copy `access` from a prior read only when the workflow says to keep the letters, and then use the role-matrix layout below instead of this one.

Format the header the way the script does:

```text
format_range({ "filepath": "<out.xlsx>", "sheet_name": "dock", "start_cell": "A1", "bold": true, "italic": true, "font_size": 12, "font_name": "Aptos Narrow" })
format_range({ "filepath": "<out.xlsx>", "sheet_name": "dock", "start_cell": "A2", "bold": true, "font_size": 24, "font_name": "Aptos Narrow" })
format_range({ "filepath": "<out.xlsx>", "sheet_name": "dock", "start_cell": "A3", "end_cell": "F3", "bold": true, "font_size": 12, "font_name": "Aptos Narrow" })
format_range({ "filepath": "<out.xlsx>", "sheet_name": "dock", "start_cell": "A4", "end_cell": "A400", "font_size": 12, "font_name": "Consolas" })
set_sheet_layout({
  "filepath": "<out.xlsx>",
  "sheet_name": "dock",
  "column_widths": { "A": 27, "B": 76, "C": 76, "D": 40, "E": 32, "F": 32 },
  "row_heights": { "1": 15.95, "2": 26.25, "3": 18 },
  "freeze": "A4"
})
```

Stop the Consolas range at the last property row.

## Object sheet with a role matrix

Use this only when copying letters that were already on the sheet. Row 1 is the display title. Row 2 is `collection:<name>` in A and `Role` in B. Row 3 names each state, once, above that state's roles. Row 4 is `Properties`, then the role names, then the five tail headers. Property rows start at row 5. Each letter sits in the role column it belongs to.

## Overview

Gridlines are off. Column A is a margin, width 6.375. Each context is the next four columns, starting at B: a rail (3.375), the content column (24.625), a rail (3.375), and a spacer (3.375). The first card is columns B–E. The next card is F–I.

| Row | Cell | Height |
| --- | --- | --- |
| 2 | Cover title in B, 36pt, medium black underline across every card column | 48 |
| 4 | `Type Specification Document` in B, 20pt Aptos Light | 21.95 |
| 6 | Top cap, filled, columns rail + content + right rail | 20.1 |
| 7 | Context title, 24pt, in the left rail. Medium underline across the rail and the content column | 27 |
| 8 | Filled rails, white content | 20.1 |
| 9 | First subdomain link, 18pt, underlined, color `0563C1`, in the content column | 27.95 |
| 10, then 12–29 | More links, then empty white content. Row 11 is the gap and gets no link | 24, and 36.95 on row 11 |
| 30 | Bottom cap, filled | 20.1 |

Row 1 is 15.95, row 3 is 11.1, row 5 is 20.1. Rows with no special height are 24. When a context has more links than fit above row 30, keep the same skip of row 11 and move the bottom cap down so the last link sits above it.

The first four cards use `C3FFC7`, `C3D9FF`, `F8CBAD`, and `BFBFBF`, then those four again. Fill the rails and both caps with that color. The content from row 8 through the row above the bottom cap is white. Do not stroke a border around the card. The only line is the medium underline under the cover and under the context title.

A link is a workbook hyperlink. The visible text is the subdomain title, written in the content cell. The target is `#'<sheet tab>'!A1`. On this server that is the `links` argument of `write_range`, not a `HYPERLINK` formula. A formula is stored as a formula and the reader finds no link.

```text
write_range({
  "path": "<out.xlsx>",
  "sheet": "Overview",
  "at": "C9",
  "rows": [["Dock"]],
  "links": [{ "cell": "C9", "target": "#'dock'!A1" }]
})
```

One column of links per context. Do not add a context that is not in the model, and do not add a type key.

```text
set_sheet_layout({
  "filepath": "<out.xlsx>",
  "sheet_name": "Overview",
  "show_gridlines": false,
  "column_widths": { "A": 6.375, "B": 3.375, "C": 24.625, "D": 3.375, "E": 3.375 }
})
format_range({ "filepath": "<out.xlsx>", "sheet_name": "Overview", "start_cell": "B6", "end_cell": "D6", "bg_color": "C3FFC7" })
format_range({ "filepath": "<out.xlsx>", "sheet_name": "Overview", "start_cell": "B7", "end_cell": "D7", "bg_color": "C3FFC7", "border_style": "medium", "border_side": "bottom" })
```

Repeat the fill for the side rails down the card and for the bottom cap. The content cells on the link rows stay white. This server's `border_style` paints all four sides of every cell, so leave it unset. A font `underline` on the cover title and the context title is the line the tool can set. It is a single underline on that text, not a medium line across the card. Do not add a box.

The cover title for this repo is `Pathways Data Dictionary`. Copy it from the existing dictionary when one exists. The subtitle stays `Type Specification Document`.
