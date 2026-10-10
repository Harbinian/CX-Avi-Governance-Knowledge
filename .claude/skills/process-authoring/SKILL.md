---
name: process-authoring
description: 兼容Governance-Knowledge旧process-authoring调用，直接转入同包single-process-authoring完整编制技能；不单独维护编制规则或成果模板。
---

# 旧入口兼容路由（Claude Code 入口）

本文件只是 Claude Code 的技能入口，兼容路由正文在
[`.agents/skills/process-authoring/SKILL.md`](../../../.agents/skills/process-authoring/SKILL.md)，
此处不复制内容；两者不一致时以 `.agents/skills/` 版本为准。

调用本入口时直接转入 [`single-process-authoring`](../single-process-authoring/SKILL.md) 及其方法正文
[`.agents/skills/single-process-authoring/SKILL.md`](../../../.agents/skills/single-process-authoring/SKILL.md)，不另立规则。

方法更新只改 `.agents/skills/` 下的技能，并同步本入口的 description；不得在本入口增补或改写方法内容。
