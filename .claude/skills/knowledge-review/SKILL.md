---
name: knowledge-review
description: 检查Governance-Knowledge的来源、适用性、覆盖、冲突及引用；用于用户主动检查，或single-process-authoring交付收尾时复核本流程使用的知识，不替代流程六维自查。
disable-model-invocation: false
---

# 知识库检查入口

用户输入`/knowledge-review`时使用，也允许single-process-authoring在交付收尾时隐式调用；实际读取并执行[同包方法](../../../.agents/skills/knowledge-review/SKILL.md)。本入口只路由，检查范围和记录方式以同包正文为准，不因普通拉取或提交自动全库检查。
