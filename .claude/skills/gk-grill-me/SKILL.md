---
name: gk-grill-me
description: 在本知识库逐个问题澄清首次流程编制；续编中用户表示符合事实后核验答案；新设计获得认可后做情景推演。区分事实核验与设计一致性及约束核验。
---

# Governance-Knowledge访谈入口

整个任务实际读取并执行[同包grill-me](../../../.agents/skills/grill-me/SKILL.md)、[会话规则](../../../rules/process-session-rules.md)及[材料读取边界](../../../rules/material-reading-boundaries.md)。本入口只路由，使用库名前缀减少同名冲突，不另立提问或判定规则；实际记录同包方法路径。

压缩或中断续接后重新读取当前规则，核对固定草稿和范围。方法及description与同包grill-me同步。
