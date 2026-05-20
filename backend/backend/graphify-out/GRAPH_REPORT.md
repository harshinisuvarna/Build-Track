# Graph Report - backend  (2026-04-27)

## Corpus Check
- 21 files · ~10,658 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 54 nodes · 44 edges · 4 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]

## God Nodes (most connected - your core abstractions)
1. `fuzzyMatch()` - 5 edges
2. `similarity()` - 4 edges
3. `localFallback()` - 4 edges
4. `bestWorkerMatch()` - 3 edges
5. `getFileUrl()` - 2 edges
6. `editDistance()` - 2 edges
7. `consonants()` - 2 edges
8. `detectCategory()` - 2 edges
9. `validateGeminiResult()` - 2 edges
10. `parseId()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `createHandler()` --calls--> `getFileUrl()`  [INFERRED]
  routes/workerRoutes.js → config/fileHelpers.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.44
Nodes (8): bestWorkerMatch(), consonants(), detectCategory(), editDistance(), fuzzyMatch(), localFallback(), similarity(), validateGeminiResult()

### Community 1 - "Community 1"
Cohesion: 0.33
Nodes (2): parseId(), resolveIds()

### Community 2 - "Community 2"
Cohesion: 0.4
Nodes (2): getFileUrl(), createHandler()

### Community 3 - "Community 3"
Cohesion: 0.5
Nodes (2): keyOf(), normalizeProjectId()

## Knowledge Gaps
- **Thin community `Community 1`** (7 nodes): `transactionRoutes.js`, `applyInventoryDelta()`, `normalizeMaterialType()`, `parseId()`, `resolveIds()`, `runTransactionCreateUpload()`, `runTransactionUpdateUpload()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 2`** (5 nodes): `fileHelpers.js`, `deleteFile()`, `getFileUrl()`, `workerRoutes.js`, `createHandler()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 3`** (5 nodes): `getStatus()`, `keyOf()`, `normalizeMaterialType()`, `normalizeProjectId()`, `inventoryRoutes.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Not enough signal to generate questions. This usually means the corpus has no AMBIGUOUS edges, no bridge nodes, no INFERRED relationships, and all communities are tightly cohesive. Add more files or run with --mode deep to extract richer edges._