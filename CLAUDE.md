# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 仓库性质

本库是内部 AI 治理知识与规则库（内容仓库），不是应用代码库：没有构建、lint 或依赖安装步骤，主要工作是起草中文知识/规则文档、按 V8 合同生成流程 JSON，以及维护离线校验包。AI 在本库的工作约定全文在 `AGENTS.md`，修改本库内容前必读；本文件是操作摘要。

流程会话实际读取`AGENTS.md`、同包主技能、`rules/process-session-rules.md`及`rules/material-reading-boundaries.md`，按阶段只读必要参考。历史快照、旧报告和链接不能自动成为当前指令；压缩或中断续接后重读当前规则并核对最新稿。

Claude Code接DeepSeek的环境与验证说明见`workflows/claude-deepseek.md`。推荐`/gk-single-process-authoring`和`/gk-grill-me`，实际检查加载路径；个人同名技能可能优先于项目入口。

- 正文内容使用中文；机器字段、文件名、代码标识使用英文。
- 引用旧 Git 提交时须说明相关文件所属的提交或包版本，不得假称新增文件已包含在旧提交中。

## 常用命令

需要 Node.js ≥18（实测 v25.2.1），无需 npm install，全部离线运行：

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

# V7顶层版本标识转换稿另存，保留真实归档；不表示3001迁移完成
node scripts/validate-process.cjs --promote <V7源文件> <新V8文件> --json

# 包一致性检查：manifest 与快照版本、全部 Markdown 本地链接、技能 frontmatter
node scripts/check-package.cjs

# 会话用例静态检查、列表及新任务目录准备；不调用模型API
node scripts/prepare-conversation-case.cjs --check
node scripts/prepare-conversation-case.cjs --list
node scripts/prepare-conversation-case.cjs --case C04 --output scratch/conversation-runs/round-1/C04
node scripts/test-conversation-preparation.cjs

# 离线合成测试（本地32项，加--source时34项）；--source仅维护者对照纯校验器时使用
node scripts/test-offline-package.cjs [--source <Infomat目录>] [--report <新报告路径>]

# 维护者专用：重建快照，同时重写空白模板与虚构示例（需该副本已安装自身依赖）
node scripts/build-technical-snapshot.cjs --source <Infomat目录>
```

检查脚本使用Node内置断言和合成示例，无需安装测试框架，两个测试脚本整体运行、没有按名称筛选单个用例的参数，改动后直接重跑整个脚本（纯离线，秒级）。`check-package.cjs`检查入口文件存在性、manifest与快照版本、来源快照SHA-256、全部Markdown本地链接、技能frontmatter及description路由、用例定义；`test-offline-package.cjs`检查JSON校验和文件保护，未指定--source时也可独立运行，其`--report`拒绝覆盖。`test-conversation-preparation.cjs`检查用例复制、输入与标准分开、拒绝覆盖及路径边界。`prepare-conversation-case.cjs`要求输出目录不存在，且只允许`scratch/`下的新目录。`scratch/`已被`.gitignore`忽略：测试证据与未指定成果目录时的默认落点`scratch/single-process-authoring/<新批次>/`都不进入git状态。实际检查记录按日期新建在verification；这些检查不替代真实模型会话、内容来源核验或业务验收。

## 架构：三层与完整性链条

**内容层**（人工编辑）：`README.md`、`AGENTS.md`、`manifest.json`、`rules/`、`workflows/`、`templates/`、`knowledge/`、`sources/`、`planning/`、`examples/`、`verification/`。各目录职责见 README 的"目录职责"表。

**编制包入口链**：会话作业入口 → 会话规则与读取边界 → `.agents/skills/single-process-authoring/`与`.agents/skills/grill-me/`；manifest登记入口、版本、四项成果及会话用例。旧process-authoring只兼容路由，只有一套方法。默认四项成果为八章正文、V8 JSON、工作平衡报告、待确认事项，问答及续接记录另存。共享包含.agents和.claude目录；Claude Code的gk前缀入口和旧入口均为薄壳，实际读取同包正文，description与目标技能一致，由check-package检查路由及描述。方法变化同步受影响入口、模板与manifest。

**技术层**（生成物，不手工编辑）：`technical/snapshot.json` 以 SHA-256 固定 `technical/contracts/`（V1/V2/V7/V8 结构，V1/V2 仅供历史依赖）、`technical/compiled-schemas.cjs`（Ajv standalone 编译）、`technical/semantic-validator.cjs`（语义规则：如 decision 仅允许 `use`、引用完整性、标识唯一）及随包的运行辅助模块 `technical/runtime/` 与许可证 `technical/licenses/`。`validate-process.cjs` 每次运行先执行 `checkIntegrity()` 逐文件核对摘要，失配即退出码 2；该脚本同时是模块，导出 `validateDocument` 与 `checkIntegrity`，新检查脚本直接 require 复用，不必解析 CLI 输出。

关键约束：

- `.gitattributes`对技术快照、空白JSON、虚构JSON、`sources/skill-snapshots/**`及`verification/conversation-fixtures/*.json`标记`-text`，对`.agents`与`.claude`下的`SKILL.md`固定`eol=lf`，防止换行转换破坏摘要或入口文件。技术文件由validate检查，原技能历史快照与来源快照摘要由check-package检查；历史快照不能作为当前业务规则执行。
- 更新技术快照的唯一途径是 `build-technical-snapshot.cjs --source <Infomat目录>`；该命令除 `technical/**` 外还重写 `templates/process-v8.blank.json` 与 `examples/demo-process-v8.json`（后者是离线测试的合法夹具），重建后须按 `sources/tooling-sources.md` 重新验证并重跑两项检查，不得手改预编译代码。
- 编制包版本与技术快照版本分别维护：当前2026-10-10.1方法包为本地准备，使用2026-10-08.1技术快照。manifest的technical_snapshot_version及结构范围与snapshot一致；兼容校验输出package_version仍指技术快照。check-package断言正式业务状态为draft、release_version为null、business_rules_approved为false；变更须有依据并同步检查。
- 移动或重命名任何文件后必须更新引用：`check-package.cjs` 扫描全部 Markdown 的本地链接并断言目标存在。

**状态区分（全库核心原则）**：技术校验通过 ≠ 用户确认事实 ≠ 3000 部门核对与正式审核发布。校验输出固定携带 `business_review: "not_assessed"` 与 `target_3000_readiness: "not_checked"`；当前 manifest 正式有效清单为空。任何报告中不得把本地准备或技术通过表述为已批准、已上传或已验收。

## 会话规则

流程编制与续编的全部会话时点规则（首次/续编的 grill-me 调用、设计推演、修订后重核等）以 `rules/process-session-rules.md` 为唯一权威；执行前实际读取该文件，不以其摘要代替。

材料进入上下文按 `rules/material-reading-boundaries.md` 控制：普通编制会话按阶段只读当前所需参考，不用全仓 `rg` 把历史原文、旧报告和预编译校验代码一并读入；维护者做文件清单、字节摘要和链接检查时可以扫描全部文件，这种检查不使其成为执行规则。

## 技能来源与分工

本库自带技能以`.agents/skills/`为唯一正文：single-process-authoring、grill-me及process-authoring兼容路由。`.claude/skills/`的两个gk前缀入口与三个旧入口不复制方法。真实会话检查实际来源；原生调用未加载本包时可按文件执行，并如实记录方式。

会话验证使用`verification/conversation-guide.md`。被测会话只接收准备目录task下的指定材料与当轮输入，不读取评审标准或结果；评审者在会话外按实际逐轮证据记录。16项用例的准备检查不能记为DeepSeek通过。

全局技能按需使用、不随库分发；与本库任务相关的常用项：

| 技能 | 用途 | 边界 |
|---|---|---|
| `norms-formatter` | 体系文件／Office／PDF 原件转 Markdown | 只做转换与格式整理，不用于制度起草、流程编制 |
| `docx`、`xlsx`、`pdf` | 读写 Word／Excel／PDF 原件，按指定模板出 Word 成果 | 专有许可，只在本机使用，不复制进本库 |
| `skill-creator` | 维护本库技能时做结构与 frontmatter 校验 | 工具校验不等于方法已获确认 |
| `humanizer-zh` | 中文正文去 AI 痕迹 | 只改表达，不得改动事实、编号与依据 |
| `doc-coauthoring` | 正文共创（可选） | 不替代四项成果与双向核对 |

同名易混：全局 `grilling`（及用户级 `grill-me` 外壳）是通用方案压测，不能替代本库 `grill-me`，也不受 `rules/process-session-rules.md` 约束；全局 `handoff` 是会话交接，与本库 `workflows/process-handoff.md`（3001／3000 人工交接）无关。仅在维护 `scripts/*.cjs` 时使用 `code-review`、`security-review`、`simplify`、`tdd`。这些全局技能按各人本机实际安装情况可用；未安装时按本库流程手工完成同等步骤，不因缺少工具降低成果要求。

## 修改边界

- 仅修改本次授权范围；不自动 git add / commit / push、不安装服务、不发布。
- 不连接或读写 3000/3001 及正式数据库；3001 导入、下载与 3000 上传均由用户主动操作。
- 校验失败时先修复有据可修的问题；不得为通过检查删除对象、清空引用、虚构业务值，或重建 `process_ref` 及其他稳定标识（改名、排序不得重新编号）。
- 不伪造执行痕迹：无法计算 SHA-256、未运行校验、未调用技能时如实写"未执行"，不假称已调用或已取得材料。
- 共享库改动走 `CONTRIBUTING.md` 与 `templates/change-request.md` 流程；具体流程任务成果写入用户指定的任务目录，不写入共享规则、示例或技术快照。
