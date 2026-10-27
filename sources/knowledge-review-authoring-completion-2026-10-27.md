# 编制收尾隐式知识检查的用户决定与变更

用户于2026-10-27要求knowledge-review可隐式调用，并在single-process-authoring结束时自动触发。本轮据此在可复核稿或最终成果交付前加入收尾调用；不建立定时任务、后台服务或Git钩子。

本次本地HEAD为`0b2d6e4d88f24b0a9dd5ee7c88208b0068262eef`，保留上一轮尚未提交的技能新增及入口改动。Gitee因DNS解析失败，当前未能重新核对远端；本记录仅证明本地准备，不标为远端已同步。

## 当前行为

编制主包与knowledge-review均登记为2026-10-27.1、prepared。主技能在本轮形成可复核稿或最终成果后、交付前调用[knowledge-review](../.agents/skills/knowledge-review/SKILL.md)的编制收尾模式；手动全库、主题或变更检查入口继续保留。

编制收尾只检查本流程实际使用的知识、来源、适用条件和本轮受影响引用，沿用当前任务基线及未变化的有效检查结果。过程默认静默，不另起访谈或新增批准。对已有依据能直接证明的成果遗漏，在原授权范围内修正并复验；缺证或冲突写入原待确认事项，不自动修订共享知识库或业务决定。

结果并入原任务记录及简短交付说明，不新增第五项必交成果或JSON字段，不继承审核结果或自动发布。原生调用不可用时可实际按同包文件执行，记录真实方式，不假称原生调用已发生。没有形成新稿的问答、状态说明不启动收尾检查，同一未变化范围不重复检查。

## 配置与兼容

Codex的allow_implicit_invocation设为true，字段采用布尔值，参见[OpenAI Docs字段说明](https://developers.openai.com/plugins/deploy/submission-errors)及本机skill-creator随附的openai.yaml说明。Claude的两个薄壳入口设置disable-model-invocation为false，保留直接调用，参数语义参见[Claude Code技能说明](https://code.claude.com/docs/en/skills#control-who-invokes-a-skill)。实际触发条件由同包主技能与检查技能正文约定；允许隐式调用的配置不单独保证模型每次都正确执行。

同步主技能、编制阶段、会话启动文本、任务记录、入口、manifest与包检查，并在既有C14交付用例的评审标准中补充收尾检查，不向被测输入泄露评审标准。22项会话实际执行状态仍为not_run，技术快照、V8/V7合同、数据库字典批次及正式有效清单保持不变。

上一轮仅手动调用的决定和检查保留于[2026-10-26记录](knowledge-review-skill-2026-10-26.md)，当前调用方式以上述规则为准。进行中的流程保留原基线；采用新版时只增加本轮引用范围的收尾复核，不重建稳定标识或覆盖旧成果。

实际验证见[收尾检查准备记录](../verification/knowledge-review-authoring-completion-2026-10-27.md)。本地配置和静态验证不表示原生客户端真实调用已验收；未提交、推送或进行公司业务发布。
