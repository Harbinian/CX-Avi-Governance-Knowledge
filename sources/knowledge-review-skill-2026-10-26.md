# 知识库按需检查技能纳入记录

> 历史记录：以下保留2026-10-26仅手动调用的决定。用户2026-10-27要求编制结束时隐式调用，当前方式见[收尾编排记录](knowledge-review-authoring-completion-2026-10-27.md)，不据本记录继续禁用隐式调用。

用户于2026-10-26提出“也可以设置检查技能，没必要自动检查嘛”。本次据此新增knowledge-review，供用户主动检查知识库整体、指定主题或本次变更。它检查来源、时效、覆盖、冲突及引用，默认输出有依据的问题和修订建议，不设置定时任务或自动修订。

基线：本地与Gitee main均为`0b2d6e4d88f24b0a9dd5ee7c88208b0068262eef`，修改前工作区干净。本次限技能正文、Codex和Claude Code入口、技能登记及受影响的操作说明与检查，不改写业务知识、字典批次、流程合同或正式有效清单。

方法正文在[knowledge-review](../.agents/skills/knowledge-review/SKILL.md)维护。Codex的agents/openai.yaml设置allow_implicit_invocation为false；Claude Code的普通名与gk前缀入口设置disable-model-invocation为true，配置依据为[Claude Code官方技能说明](https://code.claude.com/docs/en/skills#control-who-invokes-a-skill)。入口只路由到同一正文，不另立评价标准。没有创建自动化、后台服务或Git钩子，既有包及JSON技术校验继续按原适用条件执行。

检查区分已证实问题、待核实及改进建议；按明确用途和已查范围判断覆盖，旧日期不直接等同失效，缺少原件不直接等同字典错误。数据库技术证据、业务确认和当前适用性分别核对。DOC-XZ-35继续仅供参考，组织及人员仍按3000维护源与明确确认范围引用。

本技能不替代单流程六维自查，不新增统一知识库总分或业务审核门槛。用户同时授权修订时只处理已明确范围；外部操作与正式状态仍分别依据实际授权。版本登记为2026-10-26.1、状态为prepared，真实模型会话执行保持not_run；验证结果见[准备检查](../verification/knowledge-review-readiness-2026-10-26.md)。
