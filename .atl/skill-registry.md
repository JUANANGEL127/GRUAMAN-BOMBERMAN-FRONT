# Skill Registry

Generated: 2026-04-02  
Project: GRUAMAN-BOMBERMAN-FRONT

## User Skills

| Skill | Trigger | Source |
| --- | --- | --- |
| branch-pr | Creating/opening/preparing a pull request | `C:/Users/santi/.codex/skills/branch-pr/SKILL.md` |
| go-testing | Writing Go tests, teatest, adding test coverage | `C:/Users/santi/.codex/skills/go-testing/SKILL.md` |
| imagegen | Generate/edit bitmap images (photos, illustrations, sprites, mockups) | `C:/Users/santi/.codex/skills/.system/imagegen/SKILL.md` |
| issue-creation | Creating GitHub issues, bug reports, feature requests | `C:/Users/santi/.codex/skills/issue-creation/SKILL.md` |
| judgment-day | User asks for adversarial dual review ("judgment day", "doble review") | `C:/Users/santi/.codex/skills/judgment-day/SKILL.md` |
| openai-docs | Questions about building with OpenAI APIs/products with official docs | `C:/Users/santi/.codex/skills/.system/openai-docs/SKILL.md` |
| plugin-creator | Creating/scaffolding Codex plugins | `C:/Users/santi/.codex/skills/.system/plugin-creator/SKILL.md` |
| skill-creator | Creating/updating Codex skills | `C:/Users/santi/.codex/skills/.system/skill-creator/SKILL.md` |
| skill-installer | Listing/installing Codex skills | `C:/Users/santi/.codex/skills/.system/skill-installer/SKILL.md` |

## Project Skills

No project-level skills found in `.claude/skills/`, `.gemini/skills/`, `.agent/skills/`, or `skills/`.

## Project Conventions

No convention files found at project root (`AGENTS.md`, `agents.md`, `CLAUDE.md`, `.cursorrules`, `GEMINI.md`, `copilot-instructions.md`).

## Compact Rules

### branch-pr
- Use only for PR creation/update workflows.
- Follow issue-first policy before opening PR.
- Keep PR scope aligned to implemented change.

### go-testing
- Use when touching Go test suites.
- Prefer teatest patterns for Bubbletea TUIs.
- Focus on coverage additions that verify behavior.

### imagegen
- Use only for raster image generation/editing tasks.
- Avoid for SVG/vector or code-native UI assets.
- Produce bitmap-ready assets for app use.

### issue-creation
- Use when creating/updating GitHub issues.
- Capture clear scope, acceptance criteria, and impact.
- Keep issue content actionable and reviewable.

### judgment-day
- Launch dual independent reviewers for adversarial checks.
- Synthesize findings, apply fixes, and re-judge.
- Escalate after two failed iterations.

### openai-docs
- Prefer official OpenAI documentation and primary sources.
- Restrict fallback browsing to official OpenAI domains.
- Provide citations for model/API guidance.

### plugin-creator
- Scaffold plugins with required `.codex-plugin/plugin.json`.
- Add optional structure only when needed by scope.
- Keep plugin metadata explicit and testable.

### skill-creator
- Use for creating or evolving Codex skills.
- Follow skill spec and include clear triggers/workflow.
- Keep instructions concise, structured, reusable.

### skill-installer
- Use when listing or installing skills.
- Support curated and repo-based installs.
- Preserve compatibility with local Codex skill paths.
