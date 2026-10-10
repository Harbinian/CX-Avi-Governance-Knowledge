# Claude Code接DeepSeek的使用与验证

适用包：2026-10-10.1；技术快照：2026-10-08.1。当前是本地准备，真实DeepSeek会话尚未验证。本页只说明工具入口；编制方法以[主技能](../.agents/skills/single-process-authoring/SKILL.md)、[会话规则](../rules/process-session-rules.md)和[读取边界](../rules/material-reading-boundaries.md)为准。

## 接入与技能来源

2026-10-10核对的[DeepSeek官方接入说明](https://api-docs.deepseek.com/zh-cn/quick_start/agent_integrations/claude_code/)使用Anthropic兼容端点`https://api.deepseek.com/anthropic`，主模型环境标识为`deepseek-flash[1m]`；[模型说明](https://api-docs.deepseek.com/quick_start/pricing/)将`deepseek-flash`对应为DeepSeek-V4.1-Flash。名称和客户端能力会变化，执行时记录实际客户端版本、API标识及可核对的模型版本。

使用者在自己的获准环境按官方文档配置凭据和模型，不把密钥写入本库或任务记录。先运行`claude --version`，从本库根目录启动`claude`，确认当前会话模型设置。原生调用必须把技能名放在消息开头：

```text
/gk-single-process-authoring
请按本库会话作业入口处理本轮流程任务；本次模式、目标、材料和成果目录如下：
[按process-ai-collaboration.md填写]
```

需要单独进行本库访谈时使用`/gk-grill-me`。原`/single-process-authoring`、`/grill-me`和`/process-authoring`仍保留兼容入口；共享时包含`.claude/`和`.agents/`。

[Claude Code官方技能说明](https://code.claude.com/docs/en/skills)规定个人同名技能优先于项目技能。因此默认使用带`gk-`前缀的入口，并检查实际加载路径是否位于本库；前缀也不能绝对防止冲突。若加载的是别处方法，明确要求实际读取本包`.agents/skills/`正文并按文件执行，记录原生调用未取得预期入口，不改动个人技能。看到技能名、菜单项或description不等于已执行完整方法。

## 控制读取范围与续接

流程会话只按[读取边界](../rules/material-reading-boundaries.md)逐步取得当前所需材料。历史快照链接用于追溯；校验代码由Node执行，不把整份预编译文件送进模型。技能调用、关键规则读取、最新稿版本、用户事实表示／设计认可及核验范围记录在任务记录中。

官方技能文档说明压缩会限制保留的技能内容。压缩、中断续接或切换环境后，重新调用主入口并要求实际重读同包正文及当前规则，核对最新文件；重新调用薄壳本身不保证其链接正文已完整恢复。已有有据内容复用，关键修订只重核受影响范围。

## 会话验证

用[会话验证指南](../verification/conversation-guide.md)准备并逐轮执行16个虚构用例。先做静态包检查，再在真实Claude Code／DeepSeek会话中观察入口触发、实际读取、提问、判定及成果。输入与评审标准分开，被测会话不得读取评审标准。

```powershell
node scripts/check-package.cjs
node scripts/prepare-conversation-case.cjs --check
node scripts/prepare-conversation-case.cjs --list
node scripts/prepare-conversation-case.cjs --case C04 --output scratch/conversation-runs/round-1/C04
```

每个独立用例开新会话，多轮用例在同一会话依次发送；先检查实际路径和执行环境。使用者确认环境与材料范围后自行运行真实模型测试；准备脚本不连接API。C13的新会话续接与真实`/compact`续接分别记录，不能相互替代。

技术校验通过只说明结构和语义检查结果。被测用例通过只说明指定条件下的会话表现，不代表3000已接收或业务已验收。当前实际检查范围见[准备检查记录](../verification/claude-deepseek-readiness-2026-10-10.md)。
