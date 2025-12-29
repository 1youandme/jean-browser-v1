# Local-First OCR & PDF Text Extraction Capability

**Role:** Builder Browser Capability  
**Scope:** Read-only, Local Processing, Manual Execution  
**Outputs:** Annotation, Search Index, Drafting Aids (no external actions)

## Capability Definition
- Converts user-selected PDFs and images into local, content-only text artifacts and searchable indices.
- Operates entirely on-device with explicit user initiation; no background scanning or automatic execution.
- Produces:
  - Extracted plain text per page
  - Page-aware structural markers (headings, tables, captions as tags)
  - Local search index (tokens, positions)
  - Annotation layer (highlights, notes mapped to source coordinates)
  - Drafting snippets (quote blocks) for safe copy/paste into docs
- Read-only by design: source files are never modified; outputs are separate artifacts.

## Supported Formats
- PDF (vector text extraction when available; rasterized OCR fallback)
- Images: PNG, JPG/JPEG, TIFF, BMP
- Multi-page TIFF and scanned PDFs (page-by-page OCR)
- Encrypted/DRM PDFs: refuse unless user supplies password; never bypass protections

## UX Flow
- Import
  - User selects files within `Project Root` or a designated `Imports` folder.
  - Preflight screen shows file type, page count, estimated compute time.
  - Heavy compute requires confirmation; user can choose page ranges.
- Preview
  - Side-by-side: original page preview and extraction result.
  - User can annotate regions, add notes, and accept/retry per page.
- Extract
  - User clicks “Extract Text” to start; progress shown per page.
  - If vector text exists: direct extraction; else OCR pipeline runs.
  - Errors pause and present repair tips (e.g., adjust contrast, deskew).
- Save
  - Outputs saved under `.jeantrail/ocr/{doc-id}/`:
    - `text/page_{n}.txt`
    - `index/tokens.sqlite` (or JSON chunks)
    - `annotations/page_{n}.json`
    - `manifest.json` (provenance, timestamps, engine hints)
  - User can export selected text/notes to `notes.md` or `draft.md`.
- Search & Draft
  - Local search over tokens and positions; clicking results opens page preview.
  - Drafting panel inserts quote blocks with page references; no external actions.

## Guardrails
- Local-only: No uploads, cloud calls, or telemetry; processing remains on-device.
- Read-only: Source files untouched; outputs stored separately; explicit delete controls.
- No automatic execution: OCR/Extraction starts only on user click; no background indexing.
- Legal safety: No DRM circumvention; password-required PDFs prompt for user-provided password; otherwise refuse.
- Resource bounds: Max pages per run and CPU/GPU usage caps; long jobs require explicit approval.
- Consent scopes: File access limited to user-selected paths; no recursive scans beyond chosen inputs.
- Privacy: Outputs never include secret env vars or system paths; annotations and indices are local artifacts only.
- Explainability: Extraction manifest records engine choice, confidence scores, and failure reasons without sending data externally.

## Processing Pipeline (Local)
- Preflight
  - Detect text layer in PDFs; estimate OCR need and compute cost.
  - Page sampling to suggest optimal settings (contrast, binarization).
- PDF Vector Extraction
  - If text layer present: extract per page with layout markers.
  - Preserve order; embed simple structure tags (H1/H2, table boundaries as detected).
- OCR Fallback
  - Rasterize page at safe DPI; apply deskew/binarize; run local OCR engine.
  - Confidence thresholds; low-confidence segments flagged for user review.
- Indexing
  - Tokenize text; build local index with positions and page references.
  - Store index in project-local data store (file-based DB or JSON shards).
- Annotation Mapping
  - Map user highlights to source coordinates; store as separate JSON layer.
  - Support merge/reconcile if pages re-extracted.

## Safety & Compliance
- No scraping: Only operates on user-selected local files; never fetches remote content.
- No automation: Does not trigger external actions; drafting outputs are copy/paste only.
- No commerce, messaging, or external APIs: Capability is offline and advisory.
- GDPR-friendly: Data remains local; user can delete outputs; no personal data transmitted.
- Auditability: Content-free logs record operation timestamps, file IDs, page counts, and reasons for refusals.

## Execution Checkpoints
- Plan Preview: Show file list, page ranges, estimated time, and resource usage before starting.
- High-Risk Gate: Large documents or GPU acceleration prompt explicit approval.
- Diff-less Confirmation: Read-only action; confirm creation of new output artifacts and paths.
- Halt/Resume: User can pause extraction mid-run; artifacts for completed pages remain; resume continues from next page.

## Why Local-First & Read-Only
- Protects sovereignty and privacy: sensitive documents never leave the device.
- Prevents accidental changes to originals; all work is reversible and deletable.
- Enables trustworthy drafting and search without coupling to execution or external systems.
