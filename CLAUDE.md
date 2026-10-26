# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 仓库性质

本库是内部 AI 治理知识与规则库（内容仓库），不是应用代码库：没有构建、lint 或依赖安装步骤，主要工作是起草中文知识/规则文档、按 V8 合同生成流程 JSON、维护离线校验包，以及整理用友、勤哲数据库知识包。Node.js 用于流程校验、包检查与知识包检索；知识包的构建与测试另需 Python ≥3.11 标准库。AI 在本库的工作约定全文在 `AGENTS.md`，修改本库内容前必读；本文件是操作摘要。

流程会话实际读取`AGENTS.md`、同包主技能、`rules/process-session-rules.md`及`rules/material-reading-boundaries.md`，按阶段只读必要参考。历史快照、旧报告和链接不能自动成为当前指令；压缩或中断续接后重读当前规则并核对最新稿。

Claude Code接DeepSeek的环境与验证说明见`workflows/claude-deepseek.md`。推荐`/gk-single-process-authoring`和`/gk-grill-me`，实际检查加载路径；个人同名技能可能优先于项目入口。

- 正文内容使用中文；机器字段、文件名、代码标识使用英文。
- 引用旧 Git 提交时须说明相关文件所属的提交或包版本，不得假称新增文件已包含在旧提交中。

## 常用命令

需要 Node.js ≥18（实测 v25.2.1），无需 npm install；校验、检查与知识检索全部离线运行，数据库知识包的构建与测试另需 Python ≥3.11（仅标准库）：

```powershell
# 用法与退出码（脚本自身输出为准，本文件仅为摘要）
node scripts/validate-process.cjs --help

# 校验一个流程 JSON（退出码：0 通过 / 1 结构或语义失败 / 2 用法、输入或快照错误）
node scripts/validate-process.cjs <JSON路径> --json

# 检查内置技术快照完整性（版本与 SHA-256）
node scripts/validate-process.cjs --check-snapshot

# 首次新建流程骨架（生成新标识和实际时间，拒绝覆盖已有文件）
node scripts/validate-process.cjs --emit-template "<任务目录>/<流程>-process-v8.json"

# 指定目标结构摘要；不一致返回1
node scripts/validate-process.cjs <JSON路径> --expect-digest <SHA-256> --json

# V7顶层版本标识转换稿另存，保留真实归档；校验未通过仍另存并返回1；不表示3001迁移完成
node scripts/validate-process.cjs --promote <V7源文件> <新V8文件> --json

# 包一致性检查：manifest 与快照版本、全部 Markdown 本地链接、技能 frontmatter
node scripts/check-package.cjs

# 会话用例静态检查、列表及新任务目录准备；不调用模型API
node scripts/prepare-conversation-case.cjs --check
node scripts/prepare-conversation-case.cjs --list
node scripts/prepare-conversation-case.cjs --case C04 --output scratch/conversation-runs/round-1/C04
node scripts/test-conversation-preparation.cjs

# 数据库知识包离线检查：核心文件与已声明附加文件的摘要及引用（退出码：0 通过 / 1 失败）
node scripts/database-knowledge.cjs check --package <知识包目录> [--verify-sources]

# 辅助引用记录与流程 JSON 的一致性检查（不证明字段业务含义）
node scripts/database-knowledge.cjs check --package <知识包目录> --references <引用记录.json> --process <流程.json>

# 按业务主题检索知识包；--kind 为 object／field／relation／business，--limit 1..100
node scripts/database-knowledge.cjs query --package <知识包目录> --kind business --query 生产订单 [--system <系统>] [--object <object_ref>]

# 比较两个批次的对象与字段结构；只读，不修改文件
node scripts/database-knowledge.cjs diff --previous <旧批次目录> --package <新批次目录>

# 维护者构建知识包（Python ≥3.11）：只写 private/ 下的新目录，拒绝覆盖
python -X utf8 scripts/build-database-knowledge.py --config private/database-knowledge/source-config.json --output private/database-knowledge/<新批次>

# 数据库知识离线测试（24项，使用并清理自建虚构临时目录，不访问真实数据库）
python -X utf8 scripts/test-database-knowledge.py

# 离线合成测试（本地32项，加--source时34项）；--source仅维护者对照纯校验器时使用
node scripts/test-offline-package.cjs [--source <Infomat目录>] [--report <新报告路径>]

# 维护者专用：重建快照，同时重写空白模板与虚构示例（需该副本已安装自身依赖）
node scripts/build-technical-snapshot.cjs --source <Infomat目录>

# 日常默认：显式推送本维护副本的 main 到 Gitee（远程名以 git remote -v 实际地址为准）
git push gitee main:main

# 用户明确指出推送至 GitHub 时，把本地 main 的已提交内容推送到 GitHub 与 Gitee 的 main（须在 main 分支）
node scripts/push-remotes.cjs [--dry-run]
# README 配置的等价别名
git publish [--dry-run]
```

发布命令只处理已提交内容，不自动暂存或提交；两端分别执行，可能一端成功、另一端失败，须分别核对结果。其他分支按用户指定目标推送。除非用户明确指出推送至 GitHub，否则执行拉取、提交、推送等 Git 操作时，涉及远程的部分仅连接 Gitee，不默认连接或操作 GitHub。

检查脚本使用Node内置断言和合成示例，无需安装测试框架，各测试脚本整体运行、没有按名称筛选单个用例的参数，改动后直接重跑整个脚本（纯离线，秒级）。改动 Markdown、`manifest.json` 或技能文件后先跑 `check-package.cjs`；改动 `scripts/*.cjs` 后重跑对应测试脚本，改动数据库知识文档或`scripts/database-knowledge.cjs`后重跑`test-database-knowledge.py`。`check-package.cjs`检查入口文件存在性（含依据追溯、方法升级与试用记录登记项）、manifest与快照版本、来源快照SHA-256、通用方案文档包的登记/上游提交/许可摘要、`database_knowledge_package`的登记、入口存在性及固定状态（prepared、无内部目录、未批准业务规则、未启用实时查询、公共同步仅方法/工具/模板、内部包经受限渠道单独交付）、全部Markdown本地链接、技能frontmatter及description路由、用例定义；`test-offline-package.cjs`检查JSON校验和文件保护，未指定--source时也可独立运行，其`--report`拒绝覆盖。`test-conversation-preparation.cjs`检查用例复制、输入与标准分开、拒绝覆盖及路径边界。`test-database-knowledge.py`检查知识包摘要、来源、引用、附加文件缺失或篡改、路径越界及旧包兼容。`prepare-conversation-case.cjs`要求输出目录不存在，且只允许`scratch/`下的新目录。`scratch/`、`private/`、`backups/`已被`.gitignore`忽略：测试证据与未指定成果目录时的默认落点`scratch/single-process-authoring/<新批次>/`不进入git状态，`private/`存放受限内部知识包、映射与交接记录，Git忽略不等于目录访问控制。实际检查记录按日期新建在verification；这些检查不替代真实模型会话、内容来源核验或业务验收。

## 架构：内容层、编制包、数据库知识与技术层

**内容层**（人工编辑）：`README.md`、`AGENTS.md`、`manifest.json`、`rules/`、`workflows/`、`templates/`、`knowledge/`、`sources/`、`planning/`、`examples/`、`verification/`。各目录职责见 README 的"目录职责"表。

**编制包入口链**：会话作业入口 → 会话规则与读取边界 → `.agents/skills/single-process-authoring/`与`.agents/skills/grill-me/`；manifest登记入口、版本、四项成果及会话用例，并单独登记通用方案文档包（grill-with-docs，2026-10-22.1）与 lossless-pull 技能；生成或修复流程 JSON 前读取 `rules/process-v8-contract.md`（V8 合同）。旧process-authoring只兼容路由，只有一套方法。默认四项成果为八章正文、V8 JSON、工作平衡报告、待确认事项，问答及续接记录另存。共享包含.agents和.claude目录；Claude Code的gk前缀入口和旧入口均为薄壳，实际读取同包正文，description与目标技能一致，由check-package检查路由及描述。方法变化同步受影响入口、模板与manifest。

**数据库知识能力**（独立方法组件 `2026-10-26.1`，独立于流程 V7/V8 合同）：入口 `knowledge/database-knowledge.md`，引用规则 `rules/database-reference.md`，格式说明 `technical/database-knowledge-format.md`，离线工具 `scripts/database-knowledge.cjs`（同时导出 `load`、`check`、`query`、`compare`、`hash` 供其他脚本复用），维护者构建 `scripts/build-database-knowledge.py`，辅助引用模板 `templates/database-reference-record.json`，同步与领用 `workflows/database-knowledge-sharing.md`。知识包格式为 `gk-database-knowledge-v1`，辅助引用格式为 `gk-database-references-v1`。流程内 `data_ref/field_ref` 表示业务对象及字段，数据库侧 `object_ref/field_ref`（`gkdb:` 前缀）定位物理对象，两套标识不互相替换；精确映射只写入辅助引用记录，不新增到流程 JSON。真实内部结构、映射、来源路径和统计只存 Git 忽略的 `private/`；公开仓库只含方法、工具、模板和虚构验证，Git 拉取不包含内部知识包。缓存结构、历史查询和样本统计不自动等于业务确认或当前数据库状态。

**技术层**（生成物，不手工编辑）：`technical/snapshot.json` 以 SHA-256 固定 `technical/contracts/`（V1/V2/V7/V8 结构，V1/V2 仅供历史依赖）、`technical/compiled-schemas.cjs`（Ajv standalone 编译）、`technical/semantic-validator.cjs`（语义规则：如 decision 仅允许 `use`、引用完整性、标识唯一）及随包的运行辅助模块 `technical/runtime/` 与许可证 `technical/licenses/`。`validate-process.cjs` 每次运行先执行 `checkIntegrity()` 逐文件核对摘要，失配即退出码 2；该脚本同时是模块，导出 `validateDocument`、`readDocument`、`checkIntegrity`、`emitTemplate`、`promoteDocument`，新检查脚本直接 require 复用，不必解析 CLI 输出。

关键约束：

- `.gitattributes`对技术快照、空白JSON、虚构JSON、`sources/skill-snapshots/**`、`sources/licenses/**`及`verification/conversation-fixtures/*.json`标记`-text`，对`.agents`与`.claude`下的`SKILL.md`固定`eol=lf`，防止换行转换破坏摘要或入口文件。技术文件由validate检查，原技能历史快照与来源快照摘要由check-package检查；历史快照不能作为当前业务规则执行。
- 更新技术快照的唯一途径是 `build-technical-snapshot.cjs --source <Infomat目录>`；该命令除 `technical/**` 外还重写 `templates/process-v8.blank.json` 与 `examples/demo-process-v8.json`（后者是离线测试的合法夹具），重建后须按 `sources/tooling-sources.md` 重新验证，重跑 `check-package.cjs` 与 `test-offline-package.cjs`（来源等价检查加 `--source`），不得手改预编译代码。
- 编制包、数据库知识能力与技术快照版本分别维护：当前编制包2026-10-22.2在本地准备（在2026-10-22.1六维编制检查基础上接入数据库知识引用），数据库知识方法组件2026-10-26.1，使用2026-10-08.1技术快照。用户已确认完整试用、功能无问题，但该确认只覆盖2026-10-13当时版本（见manifest登记的user_trial_record）；2026-10-19.1、2026-10-20.1、2026-10-22.1、2026-10-22.2及数据库知识能力的新增内容尚未完整试用，也未经过真实AI编制会话验证。22项预设用例仍按各自实际记录说明，Git共享不改变执行结果。编制及复核读取`rules/process-evidence-traceability.md`，按`templates/process-task-record.md`登记来源实际取得、关键结论、成果位置与修订影响；复用已有记录，不逐句建台账，来源号与结论号不写入 JSON。manifest的technical_snapshot_version及结构范围与snapshot一致；兼容校验输出package_version仍指技术快照。check-package断言正式业务状态为draft、release_version为null、business_rules_approved为false；变更须有依据并同步检查。
- 移动或重命名任何文件后必须更新引用：`check-package.cjs` 扫描全部 Markdown 的本地链接并断言目标存在。

**状态区分（全库核心原则）**：技术校验通过 ≠ 用户确认事实 ≠ 3000 部门核对与正式审核发布。校验输出固定携带 `business_review: "not_assessed"` 与 `target_3000_readiness: "not_checked"`；当前 manifest 正式有效清单为空。任何报告中不得把本地准备或技术通过表述为已批准、已上传或已验收。

## 会话规则

流程编制与续编的全部会话时点规则（启动远端版本校验、首次/续编的 grill-me 调用、设计推演、修订后重核等）以 `rules/process-session-rules.md` 为唯一权威；执行前实际读取该文件，不以其摘要代替。

编制按阶段读取`rules/process-content-quality.md`，交付前记录流程逻辑与部署质量六维自查及具体理由；与工作强度六维的工作负荷评价分开，不新增JSON字段或统一分数门槛。

流程内容复核和继续治理反馈读取`rules/process-content-review.md`及`templates/process-review-feedback.md`。阶段稿允许继续治理，技术通过与内容完整性分别记录；真实案例优先、允许等效依据；理解偏差限于具体问题和已核验范围。方法确认不赋予部门责任、审批权或3000软件门槛，原案例与答复保存在独立任务目录。

材料进入上下文按 `rules/material-reading-boundaries.md` 控制：普通编制会话按阶段只读当前所需参考，不用全仓 `rg` 把历史原文、旧报告和预编译校验代码一并读入；维护者做文件清单、字节摘要和链接检查时可以扫描全部文件，这种检查不使其成为执行规则。

涉及用友、勤哲数据来源时，按 `knowledge/database-knowledge.md` 与 `rules/database-reference.md` 只检索本流程所需对象与字段，登记知识包批次、manifest摘要、来源时间及实际取得范围；未取得内部知识包时明确缺口，继续有依据支持的部分。缓存结构、历史查询、结构候选和样本统计不代替业务确认；人员和组织仍以3000为唯一维护源，字段同名或排序不证明业务含义。

组织、岗位与部门职能参考以 3000 当前目录为唯一维护源（2026-10-20 用户指定），本库只保存无人员标识副本；岗位、职务和部门职能不自动产生任务角色、审批权或账号权限，具体流程仍按材料与用户说明核实。

## 面向用户的呈现

- 面向用户的说明使用可直接阅读的业务语言：先讲结论和业务含义，再讲影响、选项和依据。
- 不在用户界面中出现内部编号（如“行为28”）、字段名、接口名、代码路径等实现细节；需要指代位置时，用步骤名称、角色名称和业务描述。
- 技术核对过程、文件路径和机器标识只在用户明确要求时给出；报告把业务结论与技术证据分开。
- 给出选项时逐项说明做法、优点、风险和推荐意见，不只给技术判断。

## 技能来源与分工

本库自带技能以`.agents/skills/`为唯一正文：single-process-authoring、grill-me、process-authoring兼容路由，独立的grill-with-docs、grilling、domain-modeling通用组合，以及lossless-pull无损拉取。`.claude/skills/`的同名和gk前缀入口不复制方法。真实会话检查实际来源；原生调用未加载本包时可按文件执行，并如实记录方式。数据库知识引用不是独立技能：按 `knowledge/database-knowledge.md` 与 `rules/database-reference.md` 执行；面向同事的静默补充说明为 `knowledge/database-knowledge-upgrade-note.md`。

通用需求或方案访谈需要同步术语与决定记录时，使用`/gk-grill-with-docs`并实际读取[同包方法](.agents/skills/grill-with-docs/SKILL.md)。依赖和格式参考均随库分发，来源及适配见[迁入记录](sources/grill-with-docs-import-2026-10-19.md)，本轮六维问题结合见[变更记录](sources/grill-with-docs-six-dimension-2026-10-22.md)；真实模型会话尚未验证。涉及流程或部署安排时按六维组织问题但不评分；单流程编制仍使用原grill-me方法并执行交付前六维自查。

会话验证使用`verification/conversation-guide.md`。被测会话只接收准备目录task下的指定材料与当轮输入，不读取评审标准或结果；评审者在会话外按实际逐轮证据记录。22项用例的准备检查不能记为DeepSeek通过。

全局技能按需使用、不随库分发；与本库任务相关的常用项：

| 技能 | 用途 | 边界 |
|---|---|---|
| `norms-formatter` | 体系文件／Office／PDF 原件转 Markdown | 只做转换与格式整理，不用于制度起草、流程编制 |
| `docx`、`xlsx`、`pdf` | 读写 Word／Excel／PDF 原件，按指定模板出 Word 成果 | 专有许可，只在本机使用，不复制进本库 |
| `skill-creator` | 维护本库技能时做结构与 frontmatter 校验 | 工具校验不等于方法已获确认 |
| `humanizer-zh` | 中文正文去 AI 痕迹 | 只改表达，不得改动事实、编号与依据 |
| `doc-coauthoring` | 正文共创（可选） | 不替代四项成果与双向核对 |

同名易混：全局或本库同包的`grilling`都是通用方案访谈，不能替代本库`grill-me`，也不承担`rules/process-session-rules.md`中的事实核验职责。全局`handoff`是会话交接，与本库`workflows/process-handoff.md`（3001／3000人工交接）无关。仅在维护`scripts/*.cjs`时使用`code-review`、`security-review`、`simplify`、`tdd`。未随库分发的技能按各人本机实际安装情况可用；未安装时按本库流程手工完成同等步骤，不因缺少工具降低成果要求。

## 修改边界

- 仅修改本次授权范围；不自动 git add / commit / push、不安装服务、不发布。除非用户明确指出推送至 GitHub，否则执行拉取、提交、推送等 Git 操作时，涉及远程的部分仅连接 Gitee（`gitee`）远程，不默认连接或操作 GitHub。用户明确要求推送 GitHub 时，才在 `main` 上使用 `git publish`（或 `node scripts/push-remotes.cjs`），并分别核对 GitHub 与 Gitee 结果。远端实际可见性与成员权限在操作前核对，提交前核对材料共享范围；不向 `Harbinian/Governance-Knowledge`（曾误记的错误地址）推送或改动任何内容。
- 不连接或读写 3000/3001、用友/勤哲等正式数据库；3001 导入、下载与 3000 上传均由用户主动操作。知识包只从明确指定的离线材料构建，不读取连接配置、密码、令牌或人员及交易记录值。
- 内部数据库结构、真实映射、来源绝对路径和统计只写入 Git 忽略的 `private/`；不得强制加入后推送。共享公共资料文件夹时排除 `private/`、`scratch/` 和 `backups/`，Git 忽略不等于目录访问控制。
- 校验失败时先修复有据可修的问题；不得为通过检查删除对象、清空引用、虚构业务值，或重建 `process_ref` 及其他稳定标识（改名、排序不得重新编号）。
- 不伪造执行痕迹：无法计算 SHA-256、未运行校验、未调用技能时如实写"未执行"，不假称已调用或已取得材料。
- 共享库改动走 `CONTRIBUTING.md` 与 `templates/change-request.md` 流程；具体流程任务成果写入用户指定的任务目录，不写入共享规则、示例或技术快照。
