---
name: create-feature-branch
description: Create a new feature branch from the latest upstream main branch.
---

Create a new Git feature branch.

- Use the specified feature text as the basis for a branch name.
- If no text is specified, use the feature currently being discussed in the conversation.
- If neither exist, ask the user before proceeding.
- Convert the name to short kebab-case.

Run:

git switch main
git fetch upstream
git pull --ff-only upstream main
git switch -c feature/<feature-name>

Finally, run:

git status
git branch --show-current

Do not modify or commit any files.
