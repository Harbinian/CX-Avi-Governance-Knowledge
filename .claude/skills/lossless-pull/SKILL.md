---
name: lossless-pull
description: 在 Governance-Knowledge 工作副本中执行不丢失本地改动的拉取：检查工作区与并发编辑，用 git stash（含未跟踪文件）备份，拉取 Gitee 的 main（仅用户明确要求时用 GitHub），恢复本地改动并报告冲突与校验结果。用户提到拉取、更新、同步、pull、无损拉取，或本地有未提交改动仍需同步远端时使用。
---

# 无损拉取入口

整个任务实际读取并执行[同包方法](../../../.agents/skills/lossless-pull/SKILL.md)。本入口只路由，不另立拉取步骤或判定规则；实际记录同包方法路径。

压缩或中断续接后重新读取当前方法，核对工作区状态、目标远程和未恢复的 stash。
