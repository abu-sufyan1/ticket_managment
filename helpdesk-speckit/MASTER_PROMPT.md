```
Read the following files before doing anything else:
- CLAUDE.md
- .specify/constitution.md
- .specify/spec.md
- .specify/plan.md
- .specify/tasks/task-01-setup.md

You are implementing the HelpDesk support ticket system described in those files.

Start with task-01-setup.md. Follow every step exactly as written.

Rules you must follow throughout this entire project:
1. Complete one task fully before moving to the next
2. After completing each task, run all tests and confirm they pass before proceeding
3. Make a git commit after each completed task using conventional commit format
4. Update CLAUDE.md if you make any architectural changes not already described
5. Never call the Anthropic API from the frontend — all AI calls go through backend/src/services/aiService.ts
6. Never use `any` in TypeScript
7. Always validate incoming request bodies with Zod on the backend
8. Always use the global error handler — never send raw errors to the client
9. Mock all external services (Claude API, email) in tests
10. When a task is complete, read the next task file and confirm you understand it before starting

After task-01 is complete and verified, read .specify/tasks/task-02-auth.md and continue.
Work through all 7 tasks in order: task-01 → task-02 → task-03 → task-04 → task-05 → task-06 → task-07.

Begin now with task-01.
```

---

## Tips for Using This Prompt

### Start fresh
Clear your Claude Code context before pasting:
```
/clear
```

### If Claude goes off track
Paste this correction prompt:
```
Stop. Re-read .specify/tasks/task-0X-[current].md and CLAUDE.md.
You are deviating from the spec. Realign and continue correctly.
```

### After each task completes
Verify manually before Claude moves on:
- Run the backend tests: `cd backend && npm test`
- Run the frontend: `cd frontend && npm run dev`
- Check git log to confirm the commit was made

### If context window fills up
Use compact to preserve context, then resume:
```
/compact

Continue from where you left off. 
Re-read CLAUDE.md and the current task file before resuming.
```

### To resume a session
If you start a new Claude Code session mid-project:
```
Read CLAUDE.md and all files in .specify/tasks/.
Identify which tasks are complete (check git log) and which are pending.
Resume from the first incomplete task.
```

claude --resume 76bc6aec-1bc8-4329-a54d-4d3e8de7a1f2