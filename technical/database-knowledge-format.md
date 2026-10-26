# 数据库知识包格式与离线工具

格式：`gk-database-knowledge-v1`。这是本库的知识与辅助映射格式，独立于流程V7/V8合同。它不改变3000、3001结构或业务审核状态。

## 文件与标识

| 文件 | 用途 |
|---|---|
| manifest.json | 批次、状态、范围、各数据文件SHA-256、来源配置摘要及统计 |
| objects.json | 对象、字段、技术元数据、键、逐次观察及冲突 |
| sources.json | 来源摘要、查询或缓存节点定位、来源时间及限制；本地受限包可另含原件位置，公开字典不包含 |
| aggregates.json | 显式允许的数字汇总；不含逐笔记录 |
| views.json | 显式选定的缓存视图定义及成员摘要；不执行SQL |
| curation.json | 业务检索标签、候选释义、对象映射、关联和实现观察 |

manifest可另以`supplemental_files`声明随包说明、辅助引用和其他已纳入文件的SHA-256。离线工具核对其中每个文件，缺失或摘要不符时停止；路径必须在包内，Windows反斜杠和斜杠写法均可，规范化后重复路径拒绝。旧包没有该可选清单时仍按原核心文件检查，不因此覆盖或迁移旧批次。

对象引用由`gkdb:`及经百分号编码的系统范围标识、数据库、架构、对象名组成；字段引用在其后附加`:field:`及字段名。重采集不因缓存节点序号变化改写引用。数据库实例发生变化时使用不同系统范围标识；无法确认同一实例时不合并。同一对象的字段观察分别保留来源，冲突值保留在`conflicts`，不静默采用最新值。

架构未采集时，`schema`为`null`，引用中的`~unresolved-schema`仅为未定位条目的命名空间，不是物理架构。不得将此类条目映射成已定位字段。XML节点ID只作该源文件内部定位，不能跨缓存文件引用。

SQL Server的`max_length`保留为字节数，精度、标度和可空性按实际结果记录。DataGrip的`StoredType`保留原格式，`not_null_marked=false`只说明缓存未标记非空，不与SQL结果中的`nullable=true`混同。未采集的默认值、字段含义及外键不补造。

每个包状态固定为`prepared`；原始本地包共享范围为`local_restricted`，经审阅并排除地址、路径、业务汇总及调查材料的随库字典为`public_dictionary`。公开字典的`aggregates.json`为空，来源仅保留摘要及范围元数据；`business_rules_approved/current_database_verified/live_queries_enabled/contains_business_rows`均为`false`。数字汇总另用`contains_aggregate_statistics`表达，不能据“没有逐笔记录”判断包可公开。技术时间、业务确认与新鲜度分别记录。

## 维护者构建

构建要求Python 3.11或以上，无额外依赖。输入配置必须放在本地受限位置，明确列出来源和采集范围；不从个人连接配置发现或读取数据库凭据。

```powershell
python -X utf8 scripts/build-database-knowledge.py --config private/database-knowledge/source-config.json --output private/database-knowledge/<新批次>
node scripts/database-knowledge.cjs check --package private/database-knowledge/<新批次> --verify-sources
node scripts/database-knowledge.cjs diff --previous private/database-knowledge/<旧批次> --package private/database-knowledge/<新批次>
```

输入配置含`package_version`、`curation_path`、`sources`和实际`baseline`。三种来源格式如下：

- `datagrip_xml`：提供原始结构文件及明确的`system_ref/database/schema`选择；只抽取表、视图、列与已采集键，不导出默认表达式、连接设置、授权或记录值。
- `query_log`：提供查询日志、SQL目录、相对结果路径的`result_root`、数据库到系统范围映射，以及显式查询清单。`role=metadata`要求所选架构过滤可从SQL核对，否则`schema`须为`null`；`role=aggregate`要求完整列白名单及纯数字结果。SQL摘要与日志不符、查询ID重复或结果行数不符时停止生成。
- `datagrip_views`：提供指定数据库的结构缓存ZIP及明确视图名和证据号。按ZIP内元数据的原始名称选定视图，保存档案及SQL成员摘要，不解压任意路径，也不执行定义。

`curation_path`指定`object_labels/field_semantics/business_objects/relations/implementation_observations`。业务标签与释义均为检索辅助；业务映射和关联保留`business_confirmation=pending`。结构候选、查询连接、一致性检查与缓存视图连接用`relation_kind`区分；每条关联保留字段对、完整条件、证据与限制。

生成只允许本仓库`private/`内的新目录，目标存在时拒绝覆盖。新包通过检查后再分发；旧包及原始文件不删除。`diff`比较已采集对象与字段结构，不修改任何文件，缺项需先区分来源范围变化与真实结构变化。

## 使用者检索与引用检查

使用[知识入口](../knowledge/database-knowledge.md)中的Node.js命令。`query`支持`--kind object|field|relation|business`、可选`--system`、`--object`和`--limit 1..100`；关键词按空格分开，逐项匹配。多个候选不会自动合并；结果有截断标记与实际来源。检索时校对文件摘要，不能把手改后的文件误当成原批次。

辅助引用记录使用`gk-database-references-v1`及[空模板](../templates/database-reference-record.json)。实际映射前填写知识包版本和manifest摘要、流程JSON摘要，以及`process_data_ref/process_field_ref/database_object_ref/database_field_ref/evidence_refs/mapping_status/confirmation_record`。模板没有映射，不是已确认案例。

```powershell
node scripts/database-knowledge.cjs check --package <知识包目录> --references <辅助引用记录.json> --process <流程.json>
```

检查核对包摘要、标识唯一性、证据、关联端点、键字段、映射所属对象及流程文件身份；不能证明字段业务含义或完整性。`--verify-sources`额外只读核对原始文件和SQL摘要，原件不可访问时明确失败，不改用派生报告。缓存ZIP的文件摘要覆盖其内容；包中另保留选定成员的摘要。

同事按[同步与使用](../workflows/database-knowledge-sharing.md)一次Git拉取取得随库字典，由`database-knowledge/current.json`定位并核对manifest摘要，运行普通`check`。该检查包括已声明的附加文件，不要求维护者的原始采集目录；公开字典拒绝`--verify-sources`并提示检查范围。本地受限旧包仍可在维护者环境按原方式核验来源。方法组件、Git提交和字典批次分别登记；已有流程不自动改写原批次引用。

回归验证使用`python -X utf8 scripts/test-database-knowledge.py`，仅创建并移除本脚本拥有的临时虚构目录，不访问真实数据库。
