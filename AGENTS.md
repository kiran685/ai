# AI Career OS — Design Rules

## Apple HIG Design System

When designing, reviewing, or modifying the UI/UX of this project, use:

`.design-rules/SKILL.md`

The Apple Design Skill is the primary design reference.

### Requirements

- Follow Apple Human Interface Guidelines principles.
- Apply them as universal design principles rather than copying Apple's UI literally.
- Prioritize clarity, hierarchy, consistency, simplicity, accessibility, responsiveness, and usability.
- Review typography, spacing, color, layout, navigation, controls, states, motion, and accessibility.
- Follow the relevant files inside `.design-rules/references/` when reviewing a specific UI area.
- Preserve existing application functionality unless explicitly asked to change it.
- Make the UI feel polished, premium, modern, and intentional.
- Ensure the design works properly on both desktop and mobile where applicable.

### Before changing UI

First inspect the existing implementation and identify the relevant Apple HIG principles.

Then:
1. Identify design problems.
2. Prioritize the highest-impact problems.
3. Implement the improvements.
4. Verify responsive behavior.
5. Check accessibility and interaction states.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
