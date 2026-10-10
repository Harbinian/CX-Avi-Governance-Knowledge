---
name: gk-single-process-authoring
description: 在Governance-Knowledge中编制或续修一个流程，先区分实际流程梳理与新流程设计，产出八章制度正文、V8 JSON、工作平衡报告和待确认事项，并按首次或续编规则使用同包grill-me。用于单流程编制、修订、校验修复及工作量补充，不用于正式审核发布或修改共享规则。
---

# Governance-Knowledge单流程入口

本入口使用库名前缀以减少与个人同名技能冲突，方法仍只有一份。整个任务实际读取并执行[同包主技能](../../../.agents/skills/single-process-authoring/SKILL.md)、[会话规则](../../../rules/process-session-rules.md)及[材料读取边界](../../../rules/material-reading-boundaries.md)，按阶段读取主技能指定参考。

访谈使用同包grill-me正文，原生入口为[gk-grill-me](../gk-grill-me/SKILL.md)，不转入个人通用技能。压缩或中断续接后重新读取当前正文与规则，核对最新文件、版本和核验范围；技能来源记录实际路径。

这里只路由，不另立方法；方法及description与同包主技能同步。
