---
name: cellix-architecture
description: Align implementation and review in apps/api, packages/axc, or packages/axc-verification with Cellix; classify domains before choosing architecture.
---

# Cellix architecture alignment

Use executable Cellix source in this order: `/Volumes/files/src/cellixjs`, then <https://github.com/CellixJs/cellixjs> if unavailable, then existing AgentCourses code already implementing the same pattern. Do not copy an entire feature when only a smaller pattern applies.

## Mandatory loading

1. **Every applicable change:** read [shared architecture](references/shared-architecture.md) and [behavioral evidence](references/behavioral-evidence.md). These own detailed layer, test, and documentation requirements.
2. **Commands or stateful workflows:** also read [command workflows](references/command-workflows.md). Creation, state transitions, audit/history, nested lifecycle, or transactional invariants trigger full applicable service-ticket inspection. Query-only APIs do not exempt independently identified business objects from aggregate modeling.
3. **Source discovery:** use the relevant sections of the [reference index](references/architecture-map.md). Inspect actual applicable source, parent/sibling composition, interfaces, exports, and test companions before design decisions. Package-level similarity is insufficient.
4. **Before final verification:** complete the [review](references/review-template.md) in the existing run record.

## Execution

Follow the [run workflow](../../harness-run-workflow.md) for scope, dependencies, context gathering, record location, and verification. Classify each concept by identity/lifecycle as aggregate, child entity, value object, or derived projection before choosing files. Select the closest vertical slice by behavior/ownership, including an aggregate slice for independently identified persisted objects even if only queried. Never infer domain shape from folders, endpoint counts, or task size.

Choose one context name and record exact reference → destination files and behaviors in the single record before coding. Include composition levels, suffixes, contracts, exports, and tests. List every applicable omitted file/behavior with a behavior-based reason; complexity, speed, and passing end-to-end tests do not justify omissions. When no close source exists, use the nearest pattern and record the deviation, rationale, and migration cost.

Implement by owning layer, reuse existing Cellix capabilities, then review the implemented tree and semantics against the recorded source. Unexplained differences are defects. Functional test success alone does not prove alignment. Run focused checks and the full AGENTS completion gate without weakening architecture guardrails.
