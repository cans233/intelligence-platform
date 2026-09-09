# Git 工作流

本文档规定本仓库的任务分支、提交和 Pull Request 规范。

## 创建任务分支

每个任务都从最新的 `origin/main` 创建独立分支：

```bash
git fetch origin --prune
git switch -c <github-username>/<type>/<description> origin/main
```

分支名称使用以下格式：

```text
<github-username>/<type>/<description>
```

例如：`cans233/docs/add-git-workflow`。

`type` 只能使用 `feat`、`fix`、`chore`、`docs`、`test`、`refactor`、`build`、`ci`。`description` 使用能说明任务内容的小写英文单词，并以短横线连接。

## Commit 规范

Commit 信息使用以下格式：

```text
type(scope): 中文描述
```

一个 commit 只包含一个独立逻辑。提交前检查当前分支、upstream、远端同步状态和暂存区内容：

```bash
git status --short --branch
git fetch origin --prune
git branch -vv
git diff --cached
```

Agent 必须先用中文给出分段提交计划，说明每个 commit 的信息、包含的文件和拆分原因。获得用户同意后，才能按计划执行暂存、commit 和 push。

## Pull Request 规范

PR 标题同样使用 `type(scope): 中文描述`。PR 正文使用中文，并采用以下结构：

```markdown
## Summary

- 说明改动内容和原因。

## Verification

- 记录实际执行的验证命令及结果。

## Notes

- 仅在存在迁移、风险、重要决策或截图时保留。
```

前端 PR 至少记录 `cd frontend && pnpm test` 和 `cd frontend && pnpm build` 的结果。涉及可见页面变化时附上截图。

## `main` 分支

禁止直接推送或强制推送 `main`。仓库当前的 GitHub 配置尚未强制执行这项规则，后续可通过分支保护规则落实。
