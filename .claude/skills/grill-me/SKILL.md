---
name: grill-me
description: 在本知识库逐个问题澄清首次流程编制；续编中用户表示符合事实后核验答案；新设计获得认可后做情景推演。区分事实核验与设计一致性及约束核验。
---

# 流程访谈与情景核验（Claude Code 入口）

本文件只是 Claude Code 的技能入口，方法正文在
[`.agents/skills/grill-me/SKILL.md`](../../../.agents/skills/grill-me/SKILL.md)，
此处不复制方法内容；两者不一致时以 `.agents/skills/` 版本为准。

使用前实际读取该方法文件，并读取
[`rules/process-session-rules.md`](../../../rules/process-session-rules.md)：调用时点（首次澄清、续编事实核验、设计推演）以会话规则为唯一权威。

同一方法也用于 [`single-process-authoring`](../single-process-authoring/SKILL.md) 的编制流程；本库规则要求使用同包方法，全局 `grilling` 或用户级同名技能是通用方案压测，不能替代本入口，也不受本库会话规则约束。

方法更新只改 `.agents/skills/` 下的技能，并同步本入口的 description；不得在本入口增补或改写方法内容。
