# 知识库按需检查技能准备检查

> 历史检查：本页记录2026-10-26的仅手动配置及当时验证。当前已调整为允许编制收尾隐式调用，见[2026-10-27检查](knowledge-review-authoring-completion-2026-10-27.md)。旧结果不代表当前配置。

范围：knowledge-review 2026-10-26.1的技能结构、显式调用配置、同包入口及包登记；依据见[纳入记录](../sources/knowledge-review-skill-2026-10-26.md)。

本次未调用该技能对公司知识进行全面评价，没有创建计划任务或自动运行入口。真实模型会话执行状态为not_run，静态配置检查不表示客户端中已经实际调用成功。

## 实际验证

- `skill-creator/scripts/quick_validate.py`对主技能检查通过。使用本机已有Python及PyYAML完成检查，未给仓库新增依赖。
- YAML解析确认Codex的allow_implicit_invocation为false，两个Claude入口的disable-model-invocation为true，名称、说明及同包正文路由一致。
- `node scripts/check-package.cjs`通过，覆盖manifest登记、技能入口、调用策略及本地链接；`git diff --check`通过。
- 在隔离副本中分别将Codex配置、Claude普通入口及gk前缀入口改为允许自动调用，包检查均拒绝；恢复后包检查通过。此项证明静态配置保护，不代替客户端原生调用测试。
- 原有字典、流程合同及正式有效清单保持不变；未暂存、提交或推送。没有实际运行新的知识库评价会话，conversation_verification_status仍为not_run。

## 保留限制

本方法需要执行者取得实际来源并判断业务含义；它不能凭包完整性证明事实正确、资料仍有效或知识完整。没有明确用途或问题范围时，只报告实际已查部分。用户调用时再记录当前版本和检查结果，不沿用本准备记录作为新一轮评价。
