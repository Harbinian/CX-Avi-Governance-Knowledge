# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 仓库性质

本库是内部 AI 治理知识与规则库（内容仓库），不是应用代码库：没有构建、lint 或依赖安装步骤，主要工作是起草中文知识/规则文档、按 V8 合同生成流程 JSON，以及维护离线校验包。AI 在本库的工作约定全文在 `AGENTS.md`，修改本库内容前必读；本文件是操作摘要。

- 正文内容使用中文；机器字段、文件名、代码标识使用英文。
- 引用旧 Git 提交时须说明相关文件所属的提交或包版本，不得假称新增文件已包含在旧提交中。

## 常用命令

需要 Node.js ≥18（实测 v25.2.1），无需 npm install，全部离线运行：

```powershell
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

# 离线合成测试（本地32项，加--source时34项）；--source仅维护者对照纯校验器时使用
node scripts/test-offline-package.cjs [--source <Infomat目录>] [--report <新报告路径>]

# 维护者专用：从指定 Infomat 工作副本重新生成 technical/ 快照（需该副本已安装自身依赖）
node scripts/build-technical-snapshot.cjs --source <Infomat目录>
```

检查脚本使用Node内置断言和合成示例，无需安装测试框架，也没有按名称筛选单项测试的参数；两个脚本均全量运行。`check-package.cjs`检查入口、链接及摘要；`test-offline-package.cjs`检查校验和文件保护，未指定--source时也可独立运行。它们不替代内容来源核验或业务验收。

## 架构：三层与完整性链条

**内容层**（人工编辑）：`README.md`、`AGENTS.md`、`manifest.json`、`rules/`、`workflows/`、`templates/`、`knowledge/`、`sources/`、`planning/`、`examples/`、`verification/`。各目录职责见 README 的"目录职责"表。

**编制包入口链**：`workflows/process-ai-collaboration.md` → `rules/process-session-rules.md` → `.agents/skills/single-process-authoring/`与`.agents/skills/grill-me/`。旧process-authoring只作兼容路由，只有一套主规则。默认四项成果为八章正文、V8 JSON、工作平衡报告、待确认事项，问答及续接记录另存。共享时必须包含.agents目录；方法变化同步入口、模板和技能。

**技术层**（生成物，不手工编辑）：`technical/snapshot.json` 以 SHA-256 固定 `technical/contracts/`（V1/V2/V7/V8 结构）、`technical/compiled-schemas.cjs`（Ajv standalone 编译）与 `technical/semantic-validator.cjs`（语义规则：如 decision 仅允许 `use`、引用完整性、标识唯一）。`validate-process.cjs` 每次运行先执行 `checkIntegrity()` 逐文件核对摘要，失配即退出码 2。

关键约束：

- `.gitattributes`对技术快照、空白JSON、虚构JSON及`sources/skill-snapshots/**`标记`-text`，防止换行转换破坏摘要。技术文件由validate检查，原技能历史快照由check-package检查；历史快照不能作为当前业务规则执行。
- 更新技术快照的唯一途径是 `build-technical-snapshot.cjs --source <Infomat目录>`，随后按 `sources/tooling-sources.md` 重新验证，不得手改预编译代码。
- 编制包版本与技术快照版本分别维护：当前2026-10-09.1方法包使用2026-10-08.1技术快照。manifest的technical_snapshot_version及结构范围应与snapshot一致；兼容校验输出package_version仍指技术快照。check-package还断言当前正式业务状态为draft、release_version为null、business_rules_approved为false；变更须有依据并同步检查。
- 移动或重命名任何文件后必须更新引用：`check-package.cjs` 扫描全部 Markdown 的本地链接并断言目标存在。

**状态区分（全库核心原则）**：技术校验通过 ≠ 用户确认事实 ≠ 3000 部门核对与正式审核发布。校验输出固定携带 `business_review: "not_assessed"` 与 `target_3000_readiness: "not_checked"`；当前 manifest 正式有效清单为空。任何报告中不得把本地准备或技术通过表述为已批准、已上传或已验收。

## 会话规则

流程编制与续编的全部会话时点规则（首次/续编的 grill-me 调用、设计推演、修订后重核等）以 `rules/process-session-rules.md` 为唯一权威；执行前实际读取该文件，不以其摘要代替。

## 修改边界

- 仅修改本次授权范围；不自动 git add / commit / push、不安装服务、不发布。
- 不连接或读写 3000/3001 及正式数据库；3001 导入、下载与 3000 上传均由用户主动操作。
- 校验失败时先修复有据可修的问题；不得为通过检查删除对象、清空引用、虚构业务值，或重建 `process_ref` 及其他稳定标识（改名、排序不得重新编号）。
- 不伪造执行痕迹：无法计算 SHA-256、未运行校验、未调用技能时如实写"未执行"，不假称已调用或已取得材料。
- 共享库改动走 `CONTRIBUTING.md` 与 `templates/change-request.md` 流程；具体流程任务成果写入用户指定的任务目录，不写入共享规则、示例或技术快照。
