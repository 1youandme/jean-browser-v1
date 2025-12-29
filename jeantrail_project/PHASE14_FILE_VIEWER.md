# Phase 14.3 — File Viewer Contracts

Status: ADDITIVE ONLY (Symbolic viewers, no filesystem)

Scope
- No filesystem access
- Symbolic only
- Deterministic resolution

Files
- `src/canvas/viewer/FileViewerTypes.ts` defines `SupportedFileType`
- `src/canvas/viewer/FileViewerResolver.ts` provides `resolveViewer(fileType)`

Behavior
- Maps a supported file type to a symbolic viewer key
- Does not open files or perform I/O

