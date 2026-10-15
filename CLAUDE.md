# Mafqoudat — Core Rules

- **Frontend**: client/src/ (React, Vite, Tailwind CSS)
- **Dashboard Components**: client/src/components/dashboard/
- **Backend**: server/ (Node.js, Express, MongoDB)

## Strict Execution Rules
1. **Go straight to source files:** When asked to update a component (e.g., Categories.jsx, GuidedSearchDialog.jsx), ONLY read those specific .jsx files and immediately apply the change using Edit or Write.
2. **NEVER read .claude/docs/ or CLAUDE.backup.md** unless the user explicitly names a .claude/docs/ file in their prompt.
3. **No repeated reads:** Once you have read a target file once, do not read it again—proceed directly to Edit.
