# 用友、勤哲数据库知识入口

本入口帮助流程编制者查找已有系统的数据对象、字段和关联依据。方法组件版本为2026-10-26.2，状态为本地已准备；它不提供实时业务记录，也不代表业务规则已经批准。已审阅的真实结构、字段和关系随`database-knowledge/`同库同步；原始审计文件、网络地址、个人电脑路径、核验统计及专项调查材料不随库分发。

## 使用前

面向同事的简短介绍及已有JSON的静默补充提示词，见[知识库升级说明](database-knowledge-upgrade-note.md)。

拉取包含本轮变更的Gitee提交后，按`database-knowledge/current.json`定位随库字典，并在任务记录中登记版本与manifest摘要。新版本要求的文件缺失时先核对Git版本及包检查，不以`private/database-knowledge/`是否存在判断字典可用。旧方法版本不附带字典时明确版本差异，继续能够依据已有材料处理的部分，不补造结构。

同事一次Git拉取即可取得方法、工具和已审阅字典，具体操作见[同步与使用说明](../workflows/database-knowledge-sharing.md)，无需再索取ZIP。方法组件版本、Git提交与字典批次分别记录。普通包内检查不要求维护者原始采集文件；公开字典只提供证据摘要，接收者不加`--verify-sources`，不把包检查写成原件重新核验。

读取[数据库引用规则](../rules/database-reference.md)。有Node.js即可离线检索，无需数据库账号、网络连接或新增npm依赖。在仓库根目录运行，具体批次由随库指针定位：

```powershell
$pointer = Get-Content database-knowledge/current.json -Raw | ConvertFrom-Json
$packageDir = Join-Path 'database-knowledge' $pointer.package_path
node scripts/database-knowledge.cjs check --package $packageDir
node scripts/database-knowledge.cjs query --package $packageDir --kind business --query 生产订单
node scripts/database-knowledge.cjs query --package $packageDir --kind object --system qinzhe --query 制造大纲 --limit 5
node scripts/database-knowledge.cjs query --package $packageDir --kind field --query 生产编号 --limit 5
node scripts/database-knowledge.cjs query --package $packageDir --kind relation --query 待办
```

检索返回匹配数、是否截断、稳定引用、来源时间和限制。多个候选分别核对，不采用结果排序推定权威。需要精确查看一个对象的字段时，复制实际检索取得的`object_ref`，用`--kind field --object <object_ref>`继续查；可添加`--query <字段关键词>`。涉及认证的字段结构默认不进入字段检索结果，原始密码、令牌、连接配置和逐笔业务记录不采集。

## 带入一个流程

1. 先说明本步骤要取得什么数据，以及读取、创建或修改哪些字段。已有说明直接复用。
2. 查业务对象和字段，核对系统、账套或数据库、架构、对象类型、记录粒度与来源时间。记录缺项和冲突。
3. 检查关联是否来自原SQL、缓存视图、样本统计或仅结构候选；保留完整条件、类型转换、版本和一对多关系。主表、明细表、工作项副本与视图分别引用。
4. 取得本流程使用者对字段映射的明确说明后，按现有合同写入正文、数据对象与表单来源；仍未知的保留待确认。
5. 用[引用记录模板](../templates/database-reference-record.json)另存精确映射，关联本次流程文件及知识包摘要。该辅助记录不能替代四项流程成果，不增加到流程JSON内。

数据库证据描述系统实际结构或某次查询结果；业务人员确认实际做法及口径。系统实施逻辑与已确认意图存在偏差时，记录偏差，不将其写成新的业务规则。人员、组织仍以3000为唯一维护源，外部系统中的人员字段只提供外部映射线索。

## 维护与换版

维护者使用Python 3.11及以上的标准库，从明确指定的离线材料构建新批次，命令、格式及差异比较见[技术格式说明](../technical/database-knowledge-format.md)。生成器只写本仓库`private/`内的新目录，拒绝覆盖已有知识包。内部配置与采集结果继续受Git忽略；从已核对批次整理公开字典时保留结构标识、来源摘要和完整使用条件，剔除原始记录、地址、个人路径及核验统计，再写入新的`database-knowledge/`批次，不覆盖旧包。当前不要求仓库私有化。

旧流程保留原知识包版本和映射；换版只处理受影响条目。对象未出现在新采集范围，不能自动解释为数据库删除。新知识包通过工具检查，仍不能称为当前数据库已核实、AI真实会话已通过或业务已验收。
