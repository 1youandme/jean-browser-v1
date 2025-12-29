# Phase 27.2: Agent Templates

## Overview
Provides a small set of predefined, editable Agent templates. Templates declare capabilities and memory scope explicitly and contain no execution logic.

## Templates
- Research Agent
  - Intent: `web_research`, `collect_sources`, `synthesize_findings`
  - Permissions: `network_access`
  - Memory: `workspace`
- Code Assistant Agent
  - Intent: `explain_code`, `refactor_code`, `generate_tests`
  - Permissions: `read_files`, `write_files`
  - Memory: `workspace`
- Browser Helper Agent
  - Intent: `summarize_page`, `extract_links`, `highlight_terms`
  - Permissions: `network_access`
  - Memory: `session`

## Properties
- Optional: Templates are definitions only and can be ignored or removed.
- Editable: Each exported object can be modified safely.
- Declarative: No embedded behavior, no execution logic.

