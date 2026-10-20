---
name: lossless-pull
description: 在 Governance-Knowledge 工作副本中执行不丢失本地改动的拉取：检查工作区与并发编辑，用 git stash（含未跟踪文件）备份，拉取 Gitee 的 main（仅用户明确要求时用 GitHub），恢复本地改动并报告冲突与校验结果。用户提到拉取、更新、同步、pull、无损拉取，或本地有未提交改动仍需同步远端时使用。
---

# 无损拉取

在不丢弃本地未提交改动的前提下同步远端 `main`。适用于本地有草稿、暂存内容或未跟踪文件，同时需要取得 Gitee 最新提交的情况。执行前读取根[工作入口](../../../AGENTS.md)。本库默认只连 Gitee，只有用户明确指出 GitHub 时才操作 GitHub。

拉取不等于提交、推送或发布。除用户当次明确授权外，不执行 `git commit`、`git push` 或 `git publish`。

## 1. 预检

先确认工作副本、分支和远程：

```bash
git rev-parse --show-toplevel
git branch --show-current
git status --porcelain=v1 -uall
git rev-parse HEAD
git stash list
```

默认分支为 `main`，默认远程为 `gitee`。用户指定其他分支或明确指出 GitHub（`origin`）时，按用户目标执行，并在报告中写明。

出现以下情况时停止并说明，不继续：

- 当前目录不是目标 Git 工作副本，或分支与用户要求不一致。
- 存在未完成的 merge、rebase、cherry-pick 或 revert（`git status` 有提示，或 `.git/MERGE_HEAD`、`.git/rebase-merge`、`.git/rebase-apply`、`.git/CHERRY_PICK_HEAD` 存在）。
- 工作区改动可能来自其他会话、编辑器或正在运行的任务；stash 会暂时移走这些文件，可能打断对方。先向用户确认。

记录拉取前 HEAD 和完整的 `git status --porcelain=v1 -uall` 输出，供恢复后核对。

## 2. 备份本地改动

没有本地改动时跳过本节。

```bash
git stash push --include-untracked -m "lossless-pull backup before gitee/main <拉取前HEAD>"
git rev-parse refs/stash
git status --porcelain=v1 -uall
```

- 用 `--include-untracked` 备份未跟踪但未忽略的文件。不要用 `--all`，避免把构建产物、缓存等忽略文件移出工作区。
- `git stash push` 返回非零时立即停止，不继续 fetch/merge；报告错误，不尝试其他清理命令。
- 记录 stash 的完整 SHA，不只记 `stash@{0}`；后续索引可能变化。
- stash 后工作区应为空（忽略文件除外）。如果仍有改动，说明存在并发写入或 stash 未覆盖全部内容：立即停止，尝试恢复 stash，并报告。
- 不删除、不覆盖其他人的 stash。

## 3. 拉取

```bash
git fetch gitee main
git merge --ff-only gitee/main
```

- 默认只连 Gitee；用户明确要求 GitHub 时，把 `gitee` 换成 `origin`。
- 只用快进合并。不要自动创建 merge commit、rebase、reset 或强制覆盖。本地有未推送提交导致无法快进时，停止并说明，让用户决定。
- `git fetch` 或 `git merge` 失败（网络、认证、非快进等）时，先按第 4 节恢复本地改动，再报告失败原因；不要把工作区留在 stash 状态。

## 4. 恢复本地改动

有 stash 时：

```bash
git stash apply --index "$STASH_SHA"
git status --porcelain=v1 -uall
git stash list --format='%gd %H'
```

- 用第 2 节记录的完整 SHA 应用，避免并发会话新增 stash 后 `stash@{0}` 指向其他记录。
- `--index` 尽量恢复原来的暂存/未暂存状态。
- `apply` 不会删除备份。确认工作区改动已回来、且 `git stash list` 中仍能找到对应 SHA 后，再找到该 SHA 对应的引用并执行 `git stash drop <引用>`；找不到对应条目时不要猜测删除，保留并报告。
- 发生冲突时 Git 会保留 stash。停止，不要手工删除 stash，也不要用 `reset --hard`、`checkout -- .`、`clean -fd` 或自动改写冲突标记。列出冲突文件和 `git stash list`，让用户决定。
- 如果 `apply --index` 因索引状态失败但工作区改动已应用，保留 stash 并报告；不要为了让命令成功而丢弃索引状态。
- 恢复后核对 `git status` 与拉取前记录。内容有疑问时，用 `git diff <stash-sha>`、`git show <stash-sha>` 对照，不凭印象判断。

## 5. 校验与报告

在本库执行：

```bash
node scripts/check-package.cjs
```

按实际输出报告。检查失败时只修复有据可修的问题，不为通过检查删除对象、清空引用或伪造业务值。其他仓库按其实际校验命令执行，没有则写明未执行。

报告至少包含：

- 远程/分支、拉取前 HEAD、拉取后 HEAD；
- 本地改动：无 / 已用 stash 备份并恢复 / 冲突且 stash 保留（SHA）；
- 冲突或失败原因；
- `check-package.cjs`：通过 / 失败（摘要）/ 未执行；
- 未执行的提交、推送或发布。

## 禁止事项

- 不使用 `git reset --hard`、`git checkout -- .`、`git clean -fd`、`git push --force`。
- 不手工 `git stash drop`；只有确认本次 stash 已成功恢复、且引用与记录的 SHA 一致后才删除。
- 不自动提交本地改动来腾出工作区；stash 是临时备份，不是提交。
- 不把拉取成功表述为业务审核、3000 核对或正式发布。
- 不在用户未明确要求时连接 GitHub 或推送任何远程。
