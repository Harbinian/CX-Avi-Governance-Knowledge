# 数据库知识的同步与使用

数据库知识方法组件：2026-10-26.2，状态为已准备。按用户2026-10-26要求，方法、工具和已审阅的真实字典在同一个公开Gitee仓库中版本管理。本轮提交推送后，同事一次拉取即可使用，无需另行索取ZIP或建立private目录。当前仍是本地准备，远端是否已包含以实际提交核对。

## 同事拉取并检查

先核对工作副本、远程地址和本地改动。远程名以实际指向Gitee的配置为准；有本地修改时按[无损拉取](../.agents/skills/lossless-pull/SKILL.md)备份与恢复，不重置或覆盖。拉取及版本差异按[会话规则](../rules/process-session-rules.md)处理。

在包含本轮变更的仓库根目录运行：

```powershell
node scripts/check-package.cjs
if ($LASTEXITCODE -ne 0) { throw '共享包或随库字典检查失败' }
$pointer = Get-Content database-knowledge/current.json -Raw | ConvertFrom-Json
$packageDir = Join-Path 'database-knowledge' $pointer.package_path
node scripts/database-knowledge.cjs query --package $packageDir --kind business --query 生产订单 --limit 5
```

check-package同时核对方法登记、字典指针、manifest摘要及包内完整性。需要单独复查字典时运行`node scripts/database-knowledge.cjs check --package $packageDir`。公开字典仅含来源摘要及定位说明，接收者不加`--verify-sources`；维护者原始文件不在同事电脑上属于预期情况，不是拉取风险。普通检查不表示原始来源在接收端重新核验或当前数据库已核实。

## 同步报告如何判断

- 方法和字典均通过检查：报告“方法与字典已同步”，记录实际Git提交、字典批次及manifest摘要。
- 仍在旧的仅方法提交：报告“方法已同步，当前版本尚未包含随库字典”，按版本规则更新；不要求反复拉取同一提交，也不按private目录缺失判断失败。
- 本轮版本已声明随库字典但文件缺失或摘要不符：报告具体文件或完整性错误，停止依赖该字典的引用，保留本地内容。
- Git冲突、未恢复stash或工作区丢失风险：仍按无损拉取的对应步骤处理，与字典的业务适用性分别报告。

## 公开字典的内容边界

随库保留真实库表字段、稳定结构标识、关系条件、视图SQL定义、字段流向、来源证据号及摘要。原始取数、网络地址、个人电脑路径、连接配置、凭据、核验统计及专项调查附件不随库分发；完整审计材料和原本地批次保留在private。是否可以公开取决于实际内容和用户授权，不因名称中有“内部字典”就要求仓库私有化。

本批次由已有只读快照整理，没有新连业务数据库；结构与实现证据不自动成为业务规则。部门职能资料继续遵守各部门颗粒度未对齐、仅供参考的限制。

## 维护及旧流程引用

维护者先在private的新批次核对原件及SQL摘要，再从已审阅内容生成新的公开字典批次，不压缩或复制整个private。保持原结构标识、来源摘要和完整使用条件；新批次与派生整理策略写入manifest，检查通过后更新database-knowledge/current.json。不得覆盖旧批次或强制暂存被忽略的原始内部包。

任务记录分别登记方法组件版本、实际Git提交、字典批次、manifest摘要及检查范围。进行中的流程保留原批次和辅助引用；采用新批次时处理受影响引用，不自动继承审核结果或改写任务分工。没有本地原件时不运行来源文件核验。

提交与推送仍由用户当次授权决定，默认仅Gitee。本说明不执行暂存、提交、推送或仓库可见性修改；Git同步成功不表示业务批准或验收。
