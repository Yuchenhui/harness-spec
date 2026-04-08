---
description: 仅用 Git 分析改动并自动生成 conventional commit 信息（可选 emoji）；支持按任务清单或变更内容分组提交，默认运行本地 Git 钩子（可 --no-verify 跳过）。无参数时默认等同于 --all --group --skip
allowed-tools: Read(**), Exec(git status, git diff, git add, git restore --staged, git commit, git rev-parse, git config), Write(.git/COMMIT_EDITMSG)
argument-hint: [--no-verify] [--all] [--amend] [--signoff] [--emoji] [--scope <scope>] [--type <type>] [--group] [--skip]
# examples:
#   - /git-commit                           # 无参数：默认 --all --group --skip（暂存所有 + 智能分组 + 跳过确认）
#   - /git-commit --all                     # 暂存所有改动并提交
#   - /git-commit --no-verify               # 跳过 Git 钩子检查
#   - /git-commit --emoji                   # 在提交信息中包含 emoji
#   - /git-commit --scope ui --type feat    # 指定作用域和类型
#   - /git-commit --amend --signoff         # 修补上次提交并签名
#   - /git-commit --group                   # 按任务清单或变更内容分组提交
#   - /git-commit --group --skip            # 分组提交且跳过审核确认
---

# Claude Command: Commit (Git-only)

该命令在**不依赖任何包管理器/构建工具**的前提下，仅通过 **Git**：

- 读取改动（staged/unstaged）
- 判断是否需要**拆分为多次提交**
- 支持按 **task.md 任务清单**或**变更内容**智能分组提交
- 为每个提交生成 **Conventional Commits** 风格的信息（可选 emoji）
- 按需执行 `git add` 与 `git commit`（默认运行本地 Git 钩子；可 `--no-verify` 跳过）

> 📌 **默认行为**：无参数调用时，自动启用 `--all --group --skip`（暂存所有改动 + 智能分组 + 跳过确认），实现一键快速提交。

---

## Usage

```bash
/git-commit                            # 默认：--all --group --skip（一键快速提交）
/git-commit --no-verify
/git-commit --emoji                    # 覆盖默认：仅启用 emoji（不自动 --all --group --skip）
/git-commit --all --signoff
/git-commit --amend
/git-commit --scope ui --type feat --emoji
/git-commit --group                    # 智能分组提交（需手动暂存，需确认）
/git-commit --group --skip             # 分组提交，跳过审核
/git-commit --group --skip --emoji     # 分组提交，跳过审核，带 emoji
```

### Options

- `--no-verify`：跳过本地 Git 钩子（`pre-commit`/`commit-msg` 等）。
- `--all`：当暂存区为空时，自动 `git add -A` 将所有改动纳入本次提交。
- `--amend`：在不创建新提交的情况下**修补**上一次提交（保持提交作者与时间，除非本地 Git 配置另有指定）。
- `--signoff`：附加 `Signed-off-by` 行（遵循 DCO 流程时使用）。
- `--emoji`：在提交信息中包含 emoji 前缀（省略则使用纯文本）。
- `--scope <scope>`：指定提交作用域（如 `ui`、`docs`、`api`），写入消息头部。
- `--type <type>`：强制提交类型（如 `feat`、`fix`、`docs` 等），覆盖自动判断。
- `--group`：**智能分组提交模式**，详见下方说明。
- `--skip`：**跳过审核确认**，直接执行提交（适用于自动化场景或确信改动无误时）。

### 默认参数

当 **没有提供任何参数** 时（即仅执行 `/git-commit`），命令自动启用以下默认组合：

```
--all --group --skip
```

| 默认参数 | 效果 |
|---------|------|
| `--all` | 自动暂存所有改动 |
| `--group` | 智能分组提交（按任务或变更内容） |
| `--skip` | 跳过审核确认，直接执行 |

> 💡 **提示**：如需覆盖默认行为，只需显式传入任意参数。例如 `/git-commit --emoji` 将**仅**启用 emoji，而不会自动附加 `--all --group --skip`。

> 注：如框架不支持交互式确认，可在 front-matter 中开启 `confirm: true` 以避免误操作。

---

## --group 智能分组提交

使用 `--group` 参数时，命令会智能分析变更并拆分为多个原子提交：

### 分组策略

1. **优先检查 task.md**
   - 在当前目录或项目根目录查找 `task.md`、`TASK.md`、`tasks.md`、`TODO.md` 等任务文件
   - 如果存在，解析已完成的任务（标记为 `[x]` 或 `✅` 的条目）
   - 将变更文件与对应的已完成任务关联，按任务分组提交
   - 每个提交信息基于任务描述生成

2. **无任务文件时按变更内容分组**
   - 按**功能模块**分组：同一目录/包的相关改动
   - 按**变更类型**分组：feat/fix/docs/test/refactor 等
   - 按**文件关联性**分组：同一功能的多文件改动（如组件+样式+测试）

### 分组提交流程

```
1. 检测 task.md 是否存在
   ├── 存在 → 解析已完成任务 → 匹配变更文件 → 按任务分组
   └── 不存在 → 分析变更内容 → 按模块/类型/关联性分组

2. 生成分组提案
   ├── 显示每个分组的文件列表
   ├── 显示每个分组的提交信息预览
   └── 等待确认（除非使用 --skip）

3. 执行分组提交
   ├── 按顺序执行每个分组的 git add + git commit
   └── 报告每个提交的结果
```

### task.md 格式示例

```markdown
## 任务清单

- [x] 实现用户登录功能
- [x] 添加登录表单验证
- [ ] 实现用户注册功能（未完成，不会触发分组）
- [x] 修复密码重置 bug
- [x] 更新 API 文档
```

当变更包含 `src/auth/login.ts`、`src/auth/validation.ts`、`src/auth/reset.ts`、`docs/api.md` 时：
- 提交 1: `feat(auth): 实现用户登录功能` → login.ts
- 提交 2: `feat(auth): 添加登录表单验证` → validation.ts
- 提交 3: `fix(auth): 修复密码重置 bug` → reset.ts
- 提交 4: `docs: 更新 API 文档` → api.md

---

## --skip 跳过审核

使用 `--skip` 参数时：
- 不显示提交预览确认提示
- 直接执行 `git add` 和 `git commit`
- 适用于：
  - 自动化脚本/CI 环境
  - 确信改动无误，不需要二次确认
  - 与 `--group` 配合快速批量提交

> ⚠️ 注意：使用 `--skip` 时请确保已充分了解待提交的改动内容。

---

## What This Command Does

1. **仓库/分支校验**
   - 通过 `git rev-parse --is-inside-work-tree` 判断是否位于 Git 仓库。
   - 读取当前分支/HEAD 状态；如处于 rebase/merge 冲突状态，先提示处理冲突后再继续。

2. **改动检测**
   - 用 `git status --porcelain` 与 `git diff` 获取已暂存与未暂存的改动。
   - 若已暂存文件为 0：
     - 若传入 `--all` → 执行 `git add -A`。
     - 否则提示你选择：继续仅分析未暂存改动并给出**建议**，或取消命令后手动分组暂存。

3. **拆分建议（Split Heuristics）**
   - 按**关注点**、**文件模式**、**改动类型**聚类（示例：源代码 vs 文档、测试；不同目录/包；新增 vs 删除）。
   - 若检测到**多组独立变更**或 diff 规模过大（如 > 300 行 / 跨多个顶级目录），建议拆分提交，并给出每一组的 pathspec（便于后续执行 `git add <paths>`）。
   - **使用 `--group` 时**：
     - 首先检查 `task.md` 等任务文件是否存在
     - 若存在，解析已完成任务并关联变更文件
     - 若不存在，按变更内容智能分组
     - 生成多个提交计划，每个对应一个逻辑单元

4. **提交信息生成（Conventional 规范，可选 Emoji）**
   - 自动推断 `type`（`feat`/`fix`/`docs`/`refactor`/`test`/`chore`/`perf`/`style`/`ci`/`revert` …）与可选 `scope`。
   - 生成消息头：`[<emoji>] <type>(<scope>)?: <subject>`（首行 ≤ 72 字符，祈使语气，仅在使用 `--emoji` 时包含 emoji）。
   - 生成消息体：要点列表（动机、实现要点、影响范围、BREAKING CHANGE 如有）。
   - 根据 Git 历史提交的主要语言选择提交信息语言。优先检查最近提交主题（例如 `git log -n 50 --pretty=%s`）判断中文/英文；若无法判断，则回退到仓库主要语言或英文。
   - 将草稿写入 `.git/COMMIT_EDITMSG`，并用于 `git commit`。

5. **执行提交**
   - 单提交场景：`git commit [-S] [--no-verify] [-s] -F .git/COMMIT_EDITMSG`
   - 多提交场景（如接受拆分建议）：按分组给出 `git add <paths> && git commit ...` 的明确指令；若允许执行则逐一完成。
   - **使用 `--skip` 时**：跳过所有确认步骤，直接执行提交命令。
   - **使用 `--group` 时**：按分组顺序依次执行，每个分组独立提交。

6. **安全回滚**
   - 如误暂存，可用 `git restore --staged <paths>` 撤回暂存（命令会给出指令，不修改文件内容）。

---

## Best Practices for Commits

- **Atomic commits**：一次提交只做一件事，便于回溯与审阅。
- **先分组再提交**：按目录/模块/功能点拆分。
- **清晰主题**：首行 ≤ 72 字符，祈使语气（如 “add… / fix…”）。
- **正文含上下文**：说明动机、方案、影响范围、风险与后续工作。
- **遵循 Conventional Commits**：`<type>(<scope>): <subject>`。

---

## Type 与 Emoji 映射（使用 --emoji 时）

- ✨ `feat`：新增功能
- 🐛 `fix`：缺陷修复（含 🔥 删除代码/文件、🚑️ 紧急修复、👽️ 适配外部 API 变更、🔒️ 安全修复、🚨 解决告警、💚 修复 CI）
- 📝 `docs`：文档与注释
- 🎨 `style`：风格/格式（不改语义）
- ♻️ `refactor`：重构（不新增功能、不修缺陷）
- ⚡️ `perf`：性能优化
- ✅ `test`：新增/修复测试、快照
- 🔧 `chore`：构建/工具/杂务（合并分支、更新配置、发布标记、依赖 pin、.gitignore 等）
- 👷 `ci`：CI/CD 配置与脚本
- ⏪️ `revert`：回滚提交
- 💥 `feat`：破坏性变更（`BREAKING CHANGE:` 段落中说明）

> 若传入 `--type`/`--scope`，将**覆盖**自动推断。
> 仅在指定 `--emoji` 标志时才会包含 emoji。

---

## Guidelines for Splitting Commits

1. **不同关注点**：互不相关的功能/模块改动应拆分。
2. **不同类型**：不要将 `feat`、`fix`、`refactor` 混在同一提交。
3. **文件模式**：源代码 vs 文档/测试/配置分组提交。
4. **规模阈值**：超大 diff（示例：>300 行或跨多个顶级目录）建议拆分。
5. **可回滚性**：确保每个提交可独立回退。

---

## Examples

**Good (使用 --emoji)**

- ✨ feat(ui): add user authentication flow
- 🐛 fix(api): handle token refresh race condition
- 📝 docs: update API usage examples
- ♻️ refactor(core): extract retry logic into helper
- ✅ test: add unit tests for rate limiter
- 🔧 chore: update git hooks and repository settings
- ⏪️ revert: revert "feat(core): introduce streaming API"

**Good (不使用 --emoji)**

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
- `fix: address linter warnings in new files` ←（如你的仓库有钩子报错）

---

## Important Notes

- **仅使用 Git**：不调用任何包管理器/构建命令（无 `pnpm`/`npm`/`yarn` 等）。
- **尊重钩子**：默认执行本地 Git 钩子；使用 `--no-verify` 可跳过。
- **不改源码内容**：命令只读写 `.git/COMMIT_EDITMSG` 与暂存区；不会直接编辑工作区文件。
- **安全提示**：在 rebase/merge 冲突、detached HEAD 等状态下会先提示处理/确认再继续。
- **可审可控**：如开启 `confirm: true`，每个实际 `git add`/`git commit` 步骤都会进行二次确认。
