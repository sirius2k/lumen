---
name: doc-sync-translation
description: This skill should be used when the user asks to "sync documents", "synchronize docs", "update Korean document", "update English document", "sync translations", "문서 동기화", "문서를 동기화", or when bilingual document pairs (EN/KR) are out of sync and need to be aligned. Uses the higher-version document as the source of truth to update the counterpart.
---

# doc-sync-translation Skill

## Overview

This skill synchronizes bilingual document pairs (English ↔ Korean) in this repository. It uses version numbers to determine which document is the source of truth and updates the counterpart accordingly.

- **Document pairs:** `README.md` ↔ `README_ko.md`
- **Version format:** `MAJOR.MINOR` (e.g., `1.0`, `1.2`) stored in the metadata section at the bottom of each file
- **Glossary location:** `docs/TRANSLATION_GLOSSARY.md`

## Document Pairs

| English | Korean |
|---------|--------|
| `README.md` | `README_ko.md` |

## Sync Workflow

### Step 1: Detect pairs

Identify which document pairs need syncing:
- If the user mentions a specific document or pair, sync only that pair.
- Otherwise, sync all document pairs.

### Step 2: Read versions

For each pair, read the version number from the metadata section at the bottom of each document:
- English: look for `- Version: X.Y`
- Korean: look for `- 버전: X.Y`

### Step 3: Determine source of truth

- **Higher version** = source of truth (the document with more recent content)
- **Lower version** = target (the document to be updated)
- **Equal versions:** Ask the user which side has the latest changes before proceeding.

### Step 4: Load glossary

Read `docs/TRANSLATION_GLOSSARY.md` to load:
- Section heading map (EN ↔ KR headings)
- Technical terms map (EN ↔ KR terms)
- Metadata fields map (EN ↔ KR metadata field names)

If the glossary does not exist yet, proceed without it and use standard Korean/English translations.

### Step 5: Detect changed sections via git diff

Run `git diff HEAD -- <source_file>` to identify exactly which lines changed in the source document since the last commit. Map changed line numbers to section headings (`##`, `###`) to produce a focused list of sections that need translation.

```bash
git diff HEAD -- README.md
```

- **If the diff is non-empty:** extract only the changed sections (by heading) and proceed to Step 6 with that targeted list.
- **If the diff is empty (working tree is clean):** the source file has no uncommitted changes. In this case, fall back to a full section-by-section comparison between the source and target documents to find any sections that are missing or differ.

### Step 6: Apply changes (targeted)

Translate and apply **only the sections identified in Step 5** to the target document:
- Use the section heading map to translate headings (if glossary available)
- Use the technical terms map for consistent terminology
- Use the metadata fields map for metadata section field names
- Preserve all code blocks, URLs, and technical identifiers exactly as-is (do not translate)
- Maintain the target document's formatting style (table alignment, list formatting, etc.)
- Leave all unchanged sections in the target document untouched

### Step 7: Update version

Set the target document's version to match the source document's version:
- Both documents in the pair must carry the same version after sync.
- English: update `- Version: X.Y`
- Korean: update `- 버전: X.Y`

### Step 8: Commit

Stage the changed files and commit with a descriptive message indicating:
- Which direction was synced (EN→KR or KR→EN)
- Which document pair(s) were updated
- The resulting version number

Example commit messages:
```
Sync README_ko.md from README.md (EN→KR, v1.1)
Sync README.md from README_ko.md (KR→EN, v1.2)
```

## Version Rules

| Action | Version Change |
|--------|---------------|
| Content change (default) | Increment MINOR (e.g., `1.0` → `1.1`) |
| Major restructure (explicit request) | Increment MAJOR (e.g., `1.0` → `2.0`) |
| After sync | Both documents carry the **source** version |

## Glossary Reference

If `docs/TRANSLATION_GLOSSARY.md` exists, always load it before translating. The glossary contains:

1. **Section Headings Map** — use this to translate `## Heading` lines
2. **Technical Terms Map** — use this for consistent terminology in body text
3. **Metadata Fields Map** — use this for the author/version section at the bottom of each document

When a term is not in the glossary, use natural Korean/English and note it for potential addition to the glossary.

## Notes

- **Language switching line:** The first line of each document contains a language switching link (e.g., `[English](README.md) | [한국어](README_ko.md)` — linking to the EN/KR counterpart). This line is **document-specific** and must **never** be synced or overwritten. Always preserve the target document's existing first line as-is.
- Code blocks (` ``` `), inline code (`` ` `` ), URLs, and model names must **never** be translated.
- Table structure and column count must match between EN and KR versions.
- After syncing, verify the target document is complete and well-formed before committing.