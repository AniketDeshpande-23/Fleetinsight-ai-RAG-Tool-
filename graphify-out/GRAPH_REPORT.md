# Graph Report - enterprise-rag  (2026-04-23)

## Corpus Check
- 4 files · ~568,395 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 8 nodes · 5 edges · 1 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]

## God Nodes (most connected - your core abstractions)
1. `load_documents()` - 2 edges
2. `create_vector_store()` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 1.0
Nodes (2): create_vector_store(), load_documents()

## Knowledge Gaps
- **Thin community `Community 0`** (3 nodes): `create_vector_store()`, `load_documents()`, `ingest.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Not enough signal to generate questions. This usually means the corpus has no AMBIGUOUS edges, no bridge nodes, no INFERRED relationships, and all communities are tightly cohesive. Add more files or run with --mode deep to extract richer edges._