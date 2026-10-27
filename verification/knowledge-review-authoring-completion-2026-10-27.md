# 编制收尾知识检查准备验证

范围：2026-10-27.1编制主包、knowledge-review隐式调用配置及收尾编排。用户决定和影响见[变更记录](../sources/knowledge-review-authoring-completion-2026-10-27.md)。

## 验证范围

核对同包主技能调用路径、Codex和Claude允许模型调用的配置、manifest中的调用方与本流程引用范围、会话入口及任务记录的衔接。原有手动入口保留，C14评审增加收尾知识检查要求，不把准备检查记为真实模型执行。

## 实际执行

- 主技能与knowledge-review均通过skill-creator的quick_validate结构检查。
- YAML解析确认Codex允许隐式调用，Claude普通及gk前缀入口允许模型调用且保留手动入口；manifest登记调用方为single-process-authoring、范围为current_process_references。
- 包检查和本地链接检查通过；在隔离副本中分别禁用Codex隐式调用、禁用两个Claude入口的模型调用，包检查均拒绝。把收尾范围改成entire_repository同样被拒绝，恢复后通过；这些是静态配置及范围登记检查，不是模型行为证明。
- 会话准备功能检查9项通过，22个用例保持实际执行not_run；离线流程检查32项通过。C14已补收尾引用复核的评审标准，未将标准加入被测输入。
- 字典及技术合同文件没有变化，正式有效清单保持为空；差异格式检查通过，未暂存、提交或推送。

## 当前限制

此项为技能指令编排，不是后台调度或运行时强制钩子。原生客户端中是否实际隐式调用、是否按限定范围完成检查，需要真实会话证据；当前conversation_verification_status为not_run。不能用静态配置通过证明业务知识正确或流程已验收。

本轮没有连接业务数据库、改写已有流程JSON、自动修订共享业务知识、暂存、提交或推送。远端版本核对因Gitee DNS失败未完成，所有本轮结果限定为本地准备。
