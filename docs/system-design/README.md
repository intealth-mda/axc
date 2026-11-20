# AXC system-design / data dictionary (Rosetta PoC setup)

**What this is:** Nick’s approved data-dictionary spreadsheet + Jason’s **cellix-rosetta** skill, used as a spreadsheet SoT experiment (prep for WDOMS).

**What this is not:** A harness-engineering iteration. Branch names follow AXC’s required `en-cur-N` pattern only because of repo rules — treat this stack as the **Rosetta PoC**, not as another Task A/B harness eng run.

| File | Purpose |
| --- | --- |
| `axc-system-design.xlsx` | Collections: `courses`, `enrollmentrequests` |

## Branches (this Rosetta stack)

| Branch | Contents |
| --- | --- |
| `en-cur-10` | This setup only (workbook + skill) — **this branch** |
| `en-cur-10-a-out` | Setup + Task A (Course catalog) |
| `en-cur-10-b-out` | Task A + Task B (EnrollmentRequest) |

## How to use

1. Open the experiment branch you want.
2. Attach `docs/system-design/axc-system-design.xlsx` (or name that path).
3. Run `/cellix-rosetta` with the Task A or B prompt/requirements.

Permission matrix is empty on purpose for now.
