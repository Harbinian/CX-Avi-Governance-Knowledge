# 数据库知识的同步与领用

数据库知识方法组件：2026-10-26.1，状态为已准备。数据库字典作为公司级技术知识，应供获准同事取得和引用。当前公开方法仓库只同步方法、工具和模板；内部字典应进入已核实的公司私有目标，或通过受限离线包交付。方法版本、Git提交和内部包批次分别记录，不以本机private隔离代替公司内共享。

## 公司级字典的共享目标

如果要求同事通过Git拉取后直接使用实际字典，应在公司私有仓库中版本管理已审阅的目录与引用文件。可选择经明确授权将现有仓库改为私有，或使用已有公司私有仓库；目标地址、实际可见性、获准成员和维护目录确定后，才把真实内容纳入该目标。对公开仓库不能仅因“公司级知识”就提交内部结构。

若现有Gitee仓库私有化后承载内部字典，公开GitHub镜像不能继续接收同一内部提交；须同时处理推送目标和双端工具的边界。私有仓库中也不纳入凭据、连接配置、原始逐笔业务结果或未审阅研究材料。尚未确定私有目标时，先准备可审查的内部同步候选及受限离线包，不将只有公共方法的Git同步报告为字典共享已完成。

## 同事先同步共享仓库

先核对`git remote -v`。从Gitee克隆的副本通常使用`origin`；维护副本可能使用`gitee`。下面的远程名必须实际指向Gitee：

```powershell
git status --short
git fetch origin main
git rev-list --left-right --count HEAD...FETCH_HEAD
```

工作区干净、当前分支为main且本地只落后时，再运行：

```powershell
git pull --ff-only origin main
git rev-parse HEAD
node scripts/check-package.cjs
```

有未提交改动时先按[无损拉取](../.agents/skills/lossless-pull/SKILL.md)处理；领先或分叉时按[会话规则](../rules/process-session-rules.md)核对，不重置或覆盖本地内容。进行中的流程继续保留其已记录基线，换版先核对影响。

## 维护者另行交付内部知识包

1. 确认获准接收范围，固定一个已检查批次，记录manifest摘要。内部结构、SQL定义、真实映射、来源路径和统计受限，不进入公开仓库；不能据“没有逐笔记录”推定包可公开。
2. 发送者在能访问原始来源的环境运行`check --verify-sources`。该检查只证明所读文件身份与引用一致，不等于实时数据库或业务验收。
3. 只打包该批次声明的核心文件、附加文件、manifest及技术验证记录，可携带指向该批次的current.json和交接清单。不压缩整个private，不打入research目录、原始结果、Excel、程序集、连接配置或凭据。旧批次不覆盖。
4. 经获准的内部渠道交付ZIP和SHA-256。交接清单记录批次、manifest摘要、共享范围、发送时检查和未验证事项；没有发送授权时只准备本地文件。

包内文件与原批次保持相同摘要。接收者可使用离线目录，但不能因此声称重新核实了原始来源。

## 接收者检查并领用

先取得发送者提供的ZIP摘要。以下PowerShell示例须替换ZIP路径和预期摘要，解压目标必须是新目录：

```powershell
$bundleFile = '<受限ZIP路径>'
$expectedSha256 = '<发送者提供的SHA-256>'
if ((Get-FileHash -LiteralPath $bundleFile -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expectedSha256.ToLowerInvariant()) {
    throw 'ZIP摘要不一致，停止领用'
}
$receivedDir = Join-Path (Get-Location) 'private/database-knowledge-incoming/batch-001'
if (Test-Path -LiteralPath $receivedDir) { throw '目标已存在，请换一个新目录' }
Expand-Archive -LiteralPath $bundleFile -DestinationPath $receivedDir
$pointer = Get-Content -LiteralPath (Join-Path $receivedDir 'current.json') -Raw | ConvertFrom-Json
$packageDir = Join-Path $receivedDir $pointer.package_path
if ((Get-FileHash -LiteralPath (Join-Path $packageDir 'manifest.json') -Algorithm SHA256).Hash.ToLowerInvariant() -ne $pointer.manifest_sha256) {
    throw '知识包manifest摘要不一致，停止领用'
}
node scripts/database-knowledge.cjs check --package $packageDir
if ($LASTEXITCODE -ne 0) { throw '知识包检查失败，停止领用' }
node scripts/database-knowledge.cjs query --package $packageDir --kind business --query 生产订单 --limit 5
```

普通`check`核对包内核心文件、已声明附加文件及引用。没有原始文件的接收者不加`--verify-sources`；普通检查通过不能写成原始来源已重新核对。获准且能访问原件时，才使用额外来源校验选项。工具不连接数据库。

示例中的current.json仅指向该交付批次，直接引用新接收目录，不覆盖本机原有current.json或已用批次。

## 在流程会话中登记

将下列信息补入[流程会话启动文本](process-ai-collaboration.md)：

```text
共享方法库：本地目录、实际Git提交及改动状态。
内部数据库知识包：获准接收的本地目录、实际批次及manifest SHA-256。
接收检查：ZIP摘要、包内检查结果；原始来源是否在本机重新核对。
按knowledge/database-knowledge.md和rules/database-reference.md离线检索。
仅引用本流程所需字段，保留来源时间、完整条件和待确认事项。
未取得内部包时据实说明，不凭公共方法文件补造本公司数据库结构。
```

工具可用性、快照来源、业务含义和业务审批分别核对。接收内部包不自动赋予数据库连接权限，也不表示可上传到任意外部AI服务。

## 提交与推送的边界

提交前审阅实际文件列表和差异，只暂存共享文件，核对没有private、真实来源、受限ZIP或Secret。不强制添加内部包。维护者默认显式推送到Gitee；仅在用户明确要求双端时使用`git publish`，见[协作帮助](collaboration-guide.md)。

本说明和工具检查不执行提交、推送、可见性变更或分发。当前公开方法仓库推送后，同事拉取共享方法；实际字典按获准的私有目标或受限离线包领用。公司私有Git同步是否已经开启，必须另有实际证据。
