# 无损拉取技能准备记录

日期：2026-10-20。状态：本地准备，已完成本地 Git 演练；真实模型会话未执行。

## 范围

- 新增 `.agents/skills/lossless-pull/SKILL.md`，作为方法正文唯一来源。
- 新增 `.claude/skills/lossless-pull/SKILL.md` 与 `.claude/skills/gk-lossless-pull/SKILL.md` 薄壳入口，只路由，不复制方法。
- `scripts/check-package.cjs` 将 `lossless-pull` 及 `gk-lossless-pull` 纳入技能、描述和路由检查。
- `manifest.json` 的 `repository_skills` 登记 `lossless-pull` 的正文、两个入口、验证记录及未执行状态。
- `README.md` 与 `CLAUDE.md` 登记技能数量、入口和用途。

## 方法要点

默认只连 Gitee；用户明确指出 GitHub 时才用 `origin`。拉取前检查未完成操作和并发编辑；用 stash（含未跟踪文件）备份；快进拉取；用记录的 stash SHA 恢复；冲突时保留 stash 并停止；不自动提交、推送或发布。

## 本地演练

在 `scratch/lossless-pull-test-2026-10-20/` 创建裸仓库、种子克隆和工作克隆，远程命名为 `gitee`，按技能步骤执行。

| 场景 | 操作 | 结果 |
|---|---|---|
| 正常恢复 | 本地修改 `file.txt` 并新增未跟踪 `local.txt`，远端新增 `remote.txt`；stash 后 fetch/merge，再按 SHA 恢复 | 拉取后 HEAD 为 `84818b4`；本地修改、未跟踪文件和远端文件同时存在；删除本次 stash 后列表为空 |
| 冲突 | 本地与远端同时修改 `file.txt`；stash 后拉取，再恢复 | 恢复停止，`file.txt` 为 `UU`；本次 stash `d5785f1…` 保留；未跟踪文件已回到工作区 |
| 无本地改动 | 干净克隆直接 fetch/merge | 快进成功，HEAD 为 `9eeefc8` |

演练只验证 Git 命令序列和冲突保留，不代表真实模型会话已通过。

## 检查

- `node scripts/check-package.cjs`：通过（`valid: true`，退出码 0；90 个 Markdown 文件、279 个本地链接）。
- `node scripts/test-offline-package.cjs`：32 项通过，0 失败。
- `node scripts/test-conversation-preparation.cjs`：9 项通过，0 失败；未调用模型 API。
- 未执行：真实模型会话、正式发布、3000 核对、业务验收。

## 结论

技能可用于本地无损拉取准备。正式使用仍以当次 `git status`、stash 记录和校验输出为准；stash 冲突未解决前不得删除备份。
