# V8流程结构与编制约束

范围：供AI生成受支持的单流程JSON，并解释现行技术合同。技术快照见 [snapshot.json](../technical/snapshot.json)，精确字段以 technical/contracts 内结构文件及 technical/semantic-validator.cjs 为准。它们来自3000/3001实际消费的合同，不因其原位置为Infomat docs/contracts而获得业务权威。

本包以 `process-governance-v8` 为新建主线，严格校验受支持V7。结构摘要与语义文件摘要分别固定，见快照。实际接收端仍需核对运行版本、业务开关、有效部门、权限和审核门槛。

## JSON骨架与稳定身份

顶层仅按合同使用 `schema_version/export_meta/process/behaviors/flow_relations/data_objects/forms/terms/migration`。不能把API的 `data/app_commit/schema_digest` 包装或问答记录放进文件本体。文件是一个完整JSON对象，无注释、无尾逗号、无Markdown围栏。

`export_meta` 记录 `package_ref/exported_at/initiating_department/compiler`；导出时间采用实际生成时间，发起部门与编制人来自任务说明，不从示例取值。`process` 记录 `process_ref/process_name/owning_department/purpose/scope/capability_domain/business_capability/classification_status`。

尚未分类使用 `unclassified`；有分类建议而待核对使用 `needs_review`；`confirmed`需要相应确认。技术通过不能自动确认业务分类。

技术标识按合同为1—160位，以英文字母或数字开始，其余可以使用英文字母、数字、点、下划线、冒号或连字符，并在本文档内唯一。新建使用离线脚本生成新骨架，避免复用模板或示例标识；同一流程修订保留process_ref及已有标识，不按改名、排序重新编号。

新建保留V8空迁移归档；旧稿保留真实来源、历史信息与归档，不清空未知内容。V1/V2结构文件随包提供，仅满足V7/V8的历史定义引用，不能据此生成旧版顶层格式。

## 行为、条件与角色

| 业务表达 | 字段或值 | 约束 |
|---|---|---|
| 实际办理 | `node_type=action` | 写清执行人、动作、对象和结果；审核也是实际办理行为 |
| 结果判断 | `decision` | 表达选择条件，不把审核或批准的实际动作藏在控制节点里 |
| 并行开始／汇合 | `parallel_split/parallel_join` | 属于控制节点；不虚构执行岗位与独立人工动作 |
| 固定部门岗位 | `actor_assignment_mode=fixed_department` | `current_actor_role`按实际部门与岗位表达；3000仍核对有效部门 |
| 全公司适用／依前序数据定部门 | `company_wide/dynamic_from_data` | 前者不是所有人共同办理；后者须有真实存在的`actor_department_data_ref`及明确`actor_position_rule` |
| 条件、时限与结果 | `trigger/timing/completion_standard`等 | 来源或确认决定取值，非入口动作不强填全流程触发条件 |
| 指定部门全部会签 | `countersign_all_required/countersign_target_departments` | 只按实际要求使用，不自动替代审批或并行汇合 |

保留`precondition/input_description/output_description`兼容字段，核对其与办理关系、正文一致。协作方若独立产生结果或作出决定，应按实际确认其行为；不为完整性擅自拆行为或指派角色。

流程关系取`sequence/condition/loop/parallel`，端点引用真实behavior_ref，不能自连。分支、退回和循环应有可回答的判断条件、去向与退出方式；并行应说明实际汇合要求。这些业务完整性不能仅凭技术校验判定。

判断节点可有一条无条件默认继续路线，不能以多个无条件出口掩盖分支。每层循环要有退出条件和去向，并行有效分支应全部进入同一汇合；若分支可能提前终止全流程，需重新明确建模方式。审核等实际动作后再判断结果，不把普通行为上的隐含分叉当成已完整建模。

## 数据、字段与表单

数据对象含`data_ref/data_name/description/information_type/fields/behavior_links/source_relations/lifecycle`；对象字段先定义`field_ref/field_name/field_type/definition`。名称相同不能单独证明为同一业务对象或已有主数据。

- action的数据操作支持`create/update/use/pending_confirmation`；decision在V8中仅允许`use`，其他控制节点不允许数据操作。
- 同一对象、同一行为不重复登记相同操作；use不代表已创建、获授权或更新全部字段。
- update的`updated_field_refs`必须引用当前对象字段；实际更新范围未知时追问，不默认全部字段。空数组可能构成业务待核对事项，不能靠严格校验通过认定更新范围完整。
- 外部来源与字段取值按材料登记，不根据文件名称、字段名或引用顺序推定权威来源。

表单为`forms → areas → items`，按实际分成“基本信息”和“明细清单”。`form_design_state`区分`current_state/proposed_design/unspecified`；未知编号按允许空值处理，不虚构受控表单编号。

表单含`form_ref/form_name/form_no/form_design_state/behavior_links/areas`；每项字段含`item_ref/item_name/item_type/required/instructions/value_usage_mode/value_origin_mode/source_links`及相应对象字段引用。多张明细分区分别保留，显示名称可以不同，业务定义通过引用复用。

表单字段用`business_data_ref/data_field_ref`引用对象字段，类型应相符。`required`为布尔，没有待定枚举；没有依据时先澄清，不能用false占位掩盖未知。字段取值使用方式为`authoritative_input/reuse_existing/calculated/external_source/pending_confirmation`，取值方式为`direct_current_process/depends_on_data/pending_confirmation`。这些设计表达不等于正式主数据权威认定。

表单操作只关联action，按真实动作选择`create/fill/modify/review/approve/confirm/read/archive/void`；只读不写成更新，填写不写成审批。取值依赖与本地引用应可追踪。

## 生命周期、未知与技术检查

生命周期登记实际已知状态、路径和事件，未知按合同使用`pending_confirmation`。业务有效性、记录保管及可识别性分别表达；归档不自动等于失效。不伪造分析完成、保存期限、分析指纹或否决依据。

匿名处理不适用时，适用性与结果按结构同时用`not_applicable`；有个人信息不自动表示应匿名化。主状态待定时保留已知明细，不清空。正文第8章覆盖记录及表单的载体、留存部门、保管责任和期限；无对应JSON字段的控制要求保留正文及事项清单。

结构允许空值时据实使用；没有待定值的布尔、枚举和时间若缺少关键事实，不猜填，保留阶段草稿及未编码事项。合法空值只说明结构允许，不能掩盖业务缺口。

离线脚本检查类型、额外字段、引用、标识重复、节点与操作等现行机器规则；不检查3001全部业务提示，也不核定事实、岗位授权、当前有效部门或正式审核。正文与JSON还须双向核对动作、条件、角色、时限、字段和记录要求。

受支持V7保留原格式，严格检查后仍可能需要3001早期兼容规范化。其他旧格式由用户在3001导入、阅读差异、核对并下载当前文件；本包不批量迁移、不降级、不改源文件。续编上传3000原案例时维持原process_ref，另一流程另建案例。
