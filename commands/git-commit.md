---
description: Analyze changes using only Git and auto-generate conventional commit messages (optional emoji); supports grouping commits by task checklist or change content, runs local Git hooks by default (can skip with --no-verify). When called with no arguments, defaults to --all --group --skip
allowed-tools: Read(**), Exec(git status, git diff, git add, git restore --staged, git commit, git rev-parse, git config), Write(.git/COMMIT_EDITMSG)
argument-hint: [--no-verify] [--all] [--amend] [--signoff] [--emoji] [--scope <scope>] [--type <type>] [--group] [--skip]
# examples:
#   - /git-commit                           # No arguments: defaults to --all --group --skip (stage all + smart grouping + skip confirmation)
#   - /git-commit --all                     # Stage all changes and commit
#   - /git-commit --no-verify               # Skip Git hook checks
#   - /git-commit --emoji                   # Include emoji in commit messages
#   - /git-commit --scope ui --type feat    # Specify scope and type
#   - /git-commit --amend --signoff         # Amend last commit and sign off
#   - /git-commit --group                   # Group commits by task checklist or change content
#   - /git-commit --group --skip            # Group commits and skip review confirmation
---

# Claude Command: Commit (Git-only)

This command uses **only Git** without relying on any package manager or build tools:

- Reads changes (staged/unstaged)
- Determines whether to **split into multiple commits**
- Supports smart grouping by **task.md checklist** or **change content**
- Generates **Conventional Commits** style messages for each commit (optional emoji)
- Executes `git add` and `git commit` as needed (runs local Git hooks by default; use `--no-verify` to skip)

> **Default behavior**: When called with no arguments, automatically enables `--all --group --skip` (stage all changes + smart grouping + skip confirmation) for one-click fast commits.

---

## Usage

```bash
/git-commit                            # Default: --all --group --skip (one-click fast commit)
/git-commit --no-verify
/git-commit --emoji                    # Overrides default: only enables emoji (does not auto-add --all --group --skip)
/git-commit --all --signoff
/git-commit --amend
/git-commit --scope ui --type feat --emoji
/git-commit --group                    # Smart grouped commits (requires manual staging, requires confirmation)
/git-commit --group --skip             # Grouped commits, skip review
/git-commit --group --skip --emoji     # Grouped commits, skip review, with emoji
```

### Options

- `--no-verify`: Skip local Git hooks (`pre-commit`/`commit-msg`, etc.).
- `--all`: When the staging area is empty, automatically run `git add -A` to include all changes in the commit.
- `--amend`: **Amend** the last commit without creating a new one (preserves commit author and timestamp unless local Git config specifies otherwise).
- `--signoff`: Append a `Signed-off-by` line (used when following the DCO process).
- `--emoji`: Include an emoji prefix in commit messages (omit for plain text).
- `--scope <scope>`: Specify the commit scope (e.g., `ui`, `docs`, `api`), written into the message header.
- `--type <type>`: Force the commit type (e.g., `feat`, `fix`, `docs`, etc.), overriding automatic detection.
- `--group`: **Smart grouped commit mode** — see details below.
- `--skip`: **Skip review confirmation** and execute commits directly (suitable for automation or when you are confident the changes are correct).

### Default Parameters

When **no arguments are provided** (i.e., just `/git-commit`), the command automatically enables the following default combination:

```
--all --group --skip
```

| Default | Effect |
|---------|--------|
| `--all` | Automatically stage all changes |
| `--group` | Smart grouped commits (by task or change content) |
| `--skip` | Skip review confirmation, execute directly |

> **Tip**: To override the defaults, simply pass any argument explicitly. For example, `/git-commit --emoji` will **only** enable emoji and will not automatically add `--all --group --skip`.

> Note: If the framework does not support interactive confirmation, you can enable `confirm: true` in the front-matter to prevent accidental operations.

---

## --group Smart Grouped Commits

When using the `--group` parameter, the command intelligently analyzes changes and splits them into multiple atomic commits:

### Grouping Strategy

1. **Check task.md first**
   - Search for `task.md`, `TASK.md`, `tasks.md`, `TODO.md`, or similar task files in the current or project root directory
   - If found, parse completed tasks (items marked with `[x]` or checkmarks)
   - Associate changed files with corresponding completed tasks and group commits by task
   - Each commit message is generated based on the task description

2. **Group by change content when no task file exists**
   - Group by **functional module**: related changes in the same directory/package
   - Group by **change type**: feat/fix/docs/test/refactor, etc.
   - Group by **file association**: multi-file changes belonging to the same feature (e.g., component + styles + tests)

### Grouped Commit Flow

```
1. Check if task.md exists
   |-- Exists -> Parse completed tasks -> Match changed files -> Group by task
   |-- Does not exist -> Analyze change content -> Group by module/type/association

2. Generate grouping proposal
   |-- Display the file list for each group
   |-- Display commit message preview for each group
   |-- Wait for confirmation (unless --skip is used)

3. Execute grouped commits
   |-- Execute git add + git commit for each group in order
   |-- Report results for each commit
```

### task.md Format Example

```markdown
## Task Checklist

- [x] Implement user login functionality
- [x] Add login form validation
- [ ] Implement user registration functionality (incomplete, will not trigger grouping)
- [x] Fix password reset bug
- [x] Update API documentation
```

When changes include `src/auth/login.ts`, `src/auth/validation.ts`, `src/auth/reset.ts`, `docs/api.md`:
- Commit 1: `feat(auth): implement user login functionality` -> login.ts
- Commit 2: `feat(auth): add login form validation` -> validation.ts
- Commit 3: `fix(auth): fix password reset bug` -> reset.ts
- Commit 4: `docs: update API documentation` -> api.md

---

## --skip Skip Review

When using the `--skip` parameter:
- The commit preview confirmation prompt is not shown
- `git add` and `git commit` are executed directly
- Suitable for:
  - Automation scripts / CI environments
  - When you are confident the changes are correct and do not need a second confirmation
  - Combined with `--group` for fast batch commits

> Warning: When using `--skip`, make sure you fully understand the changes being committed.

---

## What This Command Does

1. **Repository / branch validation**
   - Uses `git rev-parse --is-inside-work-tree` to check if inside a Git repository.
   - Reads current branch/HEAD state; if in a rebase/merge conflict state, prompts to resolve conflicts first.

2. **Change detection**
   - Uses `git status --porcelain` and `git diff` to get staged and unstaged changes.
   - If no files are staged:
     - If `--all` is passed -> execute `git add -A`.
     - Otherwise prompt to choose: continue analyzing unstaged changes and provide **suggestions**, or cancel the command and stage files manually.

3. **Split heuristics**
   - Clusters by **concern**, **file pattern**, and **change type** (e.g., source code vs docs/tests; different directories/packages; additions vs deletions).
   - If **multiple independent change groups** are detected or the diff is too large (e.g., >300 lines / spans multiple top-level directories), suggests splitting commits and provides pathspecs for each group (for subsequent `git add <paths>`).
   - **When using `--group`**:
     - First checks if task files like `task.md` exist
     - If found, parses completed tasks and associates changed files
     - If not found, groups intelligently by change content
     - Generates a multi-commit plan, one per logical unit

4. **Commit message generation (Conventional format, optional emoji)**
   - Automatically infers `type` (`feat`/`fix`/`docs`/`refactor`/`test`/`chore`/`perf`/`style`/`ci`/`revert`...) and optional `scope`.
   - Generates the header: `[<emoji>] <type>(<scope>)?: <subject>` (first line <= 72 characters, imperative mood, emoji only included when `--emoji` is used).
   - Generates the body: bullet list (motivation, implementation highlights, impact scope, BREAKING CHANGE if applicable).
   - Chooses commit message language based on the primary language of Git history. Checks recent commit subjects (e.g., `git log -n 50 --pretty=%s`) to determine Chinese/English; falls back to the repository's primary language or English if undetermined.
   - Writes the draft to `.git/COMMIT_EDITMSG` for use in `git commit`.

5. **Execute commits**
   - Single commit: `git commit [-S] [--no-verify] [-s] -F .git/COMMIT_EDITMSG`
   - Multiple commits (e.g., after accepting a split suggestion): provides explicit `git add <paths> && git commit ...` instructions for each group; executes them sequentially if allowed.
   - **When using `--skip`**: skips all confirmation steps and executes commit commands directly.
   - **When using `--group`**: executes groups in order, each group committed independently.

6. **Safe rollback**
   - If files were staged by mistake, use `git restore --staged <paths>` to unstage (the command provides instructions without modifying file contents).

---

## Best Practices for Commits

- **Atomic commits**: Each commit does one thing — easier to trace and review.
- **Group before committing**: Split by directory/module/feature.
- **Clear subject**: First line <= 72 characters, imperative mood (e.g., "add... / fix...").
- **Body with context**: Explain motivation, approach, impact scope, risks, and follow-up work.
- **Follow Conventional Commits**: `<type>(<scope>): <subject>`.

---

## Type and Emoji Mapping (when using --emoji)

- ✨ `feat`: New feature
- 🐛 `fix`: Bug fix (includes 🔥 remove code/files, 🚑️ hotfix, 👽️ adapt to external API changes, 🔒️ security fix, 🚨 resolve warnings, 💚 fix CI)
- 📝 `docs`: Documentation and comments
- 🎨 `style`: Style/formatting (no semantic changes)
- ♻️ `refactor`: Refactoring (no new features, no bug fixes)
- ⚡️ `perf`: Performance optimization
- ✅ `test`: Add/fix tests, snapshots
- 🔧 `chore`: Build/tooling/miscellaneous (merge branches, update config, release tags, pin dependencies, .gitignore, etc.)
- 👷 `ci`: CI/CD configuration and scripts
- ⏪️ `revert`: Revert commits
- 💥 `feat`: Breaking change (explained in `BREAKING CHANGE:` section)

> If `--type`/`--scope` is passed, it **overrides** automatic detection.
> Emoji is only included when the `--emoji` flag is specified.

---

## Guidelines for Splitting Commits

1. **Different concerns**: Unrelated feature/module changes should be split.
2. **Different types**: Do not mix `feat`, `fix`, `refactor` in the same commit.
3. **File patterns**: Source code vs docs/tests/config should be committed separately.
4. **Size threshold**: Very large diffs (e.g., >300 lines or spanning multiple top-level directories) should be split.
5. **Revertability**: Ensure each commit can be independently reverted.

---

## Examples

**Good (with --emoji)**

- ✨ feat(ui): add user authentication flow
- 🐛 fix(api): handle token refresh race condition
- 📝 docs: update API usage examples
- ♻️ refactor(core): extract retry logic into helper
- ✅ test: add unit tests for rate limiter
- 🔧 chore: update git hooks and repository settings
- ⏪️ revert: revert "feat(core): introduce streaming API"

**Good (without --emoji)**

- feat(ui): add user authentication flow
- fix(api): handle token refresh race condition
- docs: update API usage examples
- refactor(core): extract retry logic into helper
- test: add unit tests for rate limiter
- chore: update git hooks and repository settings
- revert: revert "feat(core): introduce streaming API"

**Split Example**

- `feat(types): add new type defs for payment method`
- `docs: update API docs for new types`
- `test: add unit tests for payment types`
- `fix: address linter warnings in new files` <-(if your repo has hook errors)

---

## Important Notes

- **Git only**: Does not invoke any package manager or build commands (no `pnpm`/`npm`/`yarn`, etc.).
- **Respects hooks**: Runs local Git hooks by default; use `--no-verify` to skip.
- **Does not modify source code**: The command only reads/writes `.git/COMMIT_EDITMSG` and the staging area; it does not directly edit working directory files.
- **Safety prompts**: Prompts for confirmation/action in rebase/merge conflict, detached HEAD, and similar states.
- **Reviewable and controllable**: If `confirm: true` is enabled, every `git add`/`git commit` step requires a second confirmation.
