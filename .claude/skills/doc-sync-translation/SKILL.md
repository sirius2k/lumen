---
name: doc-sync-translation
description: This skill should be used when the user asks to "sync documents", "synchronize docs", "update Korean document", "update English document", "sync translations", "문서 동기화", "문서를 동기화", or when bilingual document pairs (EN/KR) are out of sync and need to be aligned. Uses the higher-version document as the source of truth to update the counterpart.
---

# doc-sync-translation Skill

## Overview

This skill synchronizes bilingual document pairs (English ↔ Korean) in this repository. It references `CLAUDE.md → Document Versioning` as the single source of truth for document pairs, version format, and rules.

## Sync Workflow

### Step 1: Load configuration from CLAUDE.md

Read `CLAUDE.md → Document Versioning` section to load:
- **Document Pairs** table (the authoritative list of EN↔KR pairs)
- **Version Format** (`MAJOR.MINOR`, metadata location)
- **Rules** (version increment policy)

### Step 2: Detect pairs

Identify which document pairs need syncing:
- If the user mentions a specific document or pair, sync only that pair.
- Otherwise, sync all document pairs listed in CLAUDE.md.

### Step 3: Read versions

For each pair, read the version number from the metadata section at the bottom of each document:
- English: look for `- Version: X.Y`
- Korean: look for `- 버전: X.Y`
- If a document has no version metadata yet, treat it as `0.0`.

### Step 4: Determine source of truth

- **Higher version** = source of truth (the document with more recent content)
- **Lower version** = target (the document to be updated)
- **Equal versions:** Ask the user which side has the latest changes before proceeding.

### Step 5: Load glossary (optional)

If `docs/TRANSLATION_GLOSSARY.md` exists, read it to load:
- Section heading map (EN ↔ KR headings)
- Technical terms map (EN ↔ KR terms)
- Metadata fields map (EN ↔ KR metadata field names)

If the glossary does not exist, proceed without it and use standard Korean/English translations.

### Step 6: Detect changed sections via git diff

Run `git diff HEAD -- <source_file>` to identify exactly which lines changed in the source document since the last commit. Map changed line numbers to section headings (`##`, `###`) to produce a focused list of sections that need translation.

- **If the diff is non-empty:** extract only the changed sections (by heading) and proceed to Step 7 with that targeted list.
- **If the diff is empty (working tree is clean):** fall back to a full section-by-section comparison between the source and target documents to find any sections that are missing or differ.

### Step 7: Apply changes (targeted)

Translate and apply **only the sections identified in Step 6** to the target document:
- Use the glossary maps for consistent terminology (if available)
- Preserve all code blocks, URLs, and technical identifiers exactly as-is (do not translate)
- Maintain the target document's formatting style (table alignment, list formatting, etc.)
- Leave all unchanged sections in the target document untouched

### Step 8: Confirm with user

Per CLAUDE.md's **Version Update Prompt** policy, ask the user before finishing:

1. Whether to increment the version (and confirm minor vs major)
2. Whether the sync result looks correct
3. Whether to commit the changes

Do **NOT** silently update versions or commit — always confirm with the user first.

### Step 9: Apply version and commit (after user approval)

Once the user confirms:
- Set both documents to the agreed version number
  - English: `- Version: X.Y`
  - Korean: `- 버전: X.Y`
- Stage the changed files and commit with a descriptive message:

```
Sync README_ko.md from README.md (EN→KR, v1.1)
Sync CLAUDE_ko.md from CLAUDE.md (EN→KR, v1.2)
```

## Notes

- **Language switching line:** The first line of each document contains a language switching link. This line is **document-specific** and must **never** be synced or overwritten. Always preserve the target document's existing first line as-is.
- Code blocks, inline code, URLs, and model names must **never** be translated.
- Table structure and column count must match between EN and KR versions.
- After syncing, verify the target document is complete and well-formed before committing.