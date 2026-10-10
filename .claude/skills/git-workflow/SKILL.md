---
name: git-workflow
description: Git conventions for Go and Tell - small Conventional Commits, push to origin main as work proceeds, attribution trailer, what needs the owner's approval, Windows line-ending notes. Use whenever committing, pushing, branching or touching history.
---

# Git workflow

Remote: `origin` = https://github.com/mikekane007/eask.git, default branch `main`.
The owner said to push as work progresses ("while coding be pushing"), so pushing normal commits to
`main` is authorized. Nothing else about the remote is.

## Allowed without asking

- Commit small, working increments and `git push` them to `main` after the build passes.
- Create feature branches for risky or experimental work.

## Ask first

- Force-push, rewriting pushed history, deleting branches with unmerged work.
- Changing repo visibility, adding collaborators, tokens or secrets, deploying or publishing.
- Never `--no-verify`, never commit `node_modules`, `dist`, `.angular`, `.playwright-mcp`, env files.

## Commits

```
<type>(<scope>): <subject>

<body: why, then what, wrapped ~100>

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
```

- Types: feat fix perf refactor test docs build chore.
- Scopes: engine, ui, game, data, service, styles, build, skills.
- Subject imperative, lowercase, no period, 72 characters or fewer.
- One logical change per commit; build green before each push.
- Stage deliberately (`git add <paths>`), check `git diff --cached --name-only`, then commit.
  Confirm with `git log -1` that the commit exists.

## Windows

Git prints "LF will be replaced by CRLF" warnings; they are harmless. Do not add `.gitattributes`
churn without a reason.

## Gotchas

- 2026-10-10: Write multi-line commit messages with `git commit -m "subject" -m "body" -m "trailer"`
  (short) or a file and `git commit -F`; avoid stacking several heredocs in one shell command.
- 2026-10-10: The project repo was initialised inside `go-and-tell/`, not the parent `EJG` folder.
  Run git from `go-and-tell/`.
- 2026-10-10: A hook or classifier may deny reads of unrelated folders (it blocked
  `Desktop/mntzring`). Ask the owner for the exact path instead of working around it.
