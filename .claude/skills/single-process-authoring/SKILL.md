---
name: single-process-authoring
description: 在Governance-Knowledge中编制或续修一个流程，先区分实际流程梳理与新流程设计，产出八章制度正文、V8 JSON、工作平衡报告和待确认事项，并按首次或续编规则使用同包grill-me。用于单流程编制、修订、校验修复及工作量补充，不用于正式审核发布或修改共享规则。
---

# 单流程完整编制（Claude Code 入口）

本文件只是 Claude Code 的技能入口，方法正文在
[`.agents/skills/single-process-authoring/SKILL.md`](../../../.agents/skills/single-process-authoring/SKILL.md)，
此处不复制方法内容；两者不一致时以 `.agents/skills/` 版本为准。

开始工作前实际读取该方法文件，再按任务阶段读取所需参考，不展开整个 `references/`。并读取仓库根 `README.md`、`AGENTS.md`、`manifest.json` 与
[`workflows/process-ai-collaboration.md`](../../../workflows/process-ai-collaboration.md)；会话时点规则以
[`rules/process-session-rules.md`](../../../rules/process-session-rules.md) 为唯一权威，不以摘要代替。

整个任务遵守[材料读取边界](../../../rules/material-reading-boundaries.md)；历史快照链接只用于指定追溯。压缩或中断续接后重新读取主技能及当前规则，核对最新文件和核验范围。

方法更新只改 `.agents/skills/` 下的技能，并同步本入口的 description；不得在本入口增补或改写方法内容。
