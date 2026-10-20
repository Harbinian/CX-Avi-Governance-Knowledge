# 内部 AI 治理知识与规则库

本库供内部同事共享治理知识、规则、AI 作业方法和模板，作为与 AI 会话设计或编制业务流程的共同基础。远程托管采用 GitHub 和 Gitee，维护工作副本默认向两端推送。本库与 Infomat 独立维护，每位同事使用自己的工作副本和任务材料。

GitHub 远程仓库：[Harbinian/CX-Avi-Governance-Knowledge](https://github.com/Harbinian/CX-Avi-Governance-Knowledge)；Gitee 远程仓库：[HarbinianCN/CX-Avi-Governance-Knowledge](https://gitee.com/HarbinianCN/CX-Avi-Governance-Knowledge)。两端当前均为公开仓库，推送前核对材料的共享范围。`Governance-Knowledge` 为本库简称，本地工作副本目录可自行选择。

## 使用者快速上手（Gitee）

本节面向使用本库编制流程、或需要提出修改的同事。只阅读和使用知识库时，可以直接浏览或克隆公开仓库，不需要 Gitee 账号；需要推送修改或发起合并请求时，才需要注册账号并取得相应权限。

### 1. 注册 Gitee 账号

1. 打开 [Gitee](https://gitee.com)，点击“注册”。
2. 使用邮箱或手机号完成注册并登录。
3. 如需推送代码，在“设置 → 安全设置 → 私人令牌”生成令牌，勾选 `projects` 权限。令牌只用于 Git 认证，不要写入仓库、文档或发给他人。

### 2. 安装并配置 Git

Windows 可从 [Git 官网](https://git-scm.com/download/win) 下载安装。安装后在终端配置提交身份：

```bash
git config --global user.name "<你的姓名或工号>"
git config --global user.email "<你的邮箱>"
```

### 3. 克隆仓库

```bash
git clone https://gitee.com/HarbinianCN/CX-Avi-Governance-Knowledge.git
cd CX-Avi-Governance-Knowledge
git rev-parse HEAD
```

Gitee 默认分支为 `main`。记录当前提交标识，作为本次使用的版本基线。

### 4. 校验远端版本与拉取更新

开始治理工作前先核对 Gitee 远端版本，确认本地基线。以下以本维护副本的 `gitee` 远程为例；从 Gitee 克隆的副本通常使用 `origin`，以 `git remote -v` 的实际地址为准：

```bash
git rev-parse HEAD
git fetch gitee main
git rev-parse FETCH_HEAD
git rev-list --left-right --count HEAD...FETCH_HEAD
```

`rev-list` 输出为“本地独有提交数　远端独有提交数”。本地落后时再拉取：

```bash
git pull --ff-only
```

拉取前工作区应为 clean；有本地修改时先按[无损拉取](.agents/skills/lossless-pull/SKILL.md)处理，或提交、暂存。核对和拉取只连接 Gitee；除明确要求外不操作 GitHub。

### 5. 修改内容

只影响本次流程任务的成果，写入自己的任务目录，不修改共享规则、示例或技术快照。

需要修改共享内容时，先按 [贡献说明](CONTRIBUTING.md) 和 [修改申请模板](templates/change-request.md) 记录修改原因、依据、适用范围和影响条目，再从最新 `main` 创建独立分支：

```bash
git switch main
git pull --ff-only
git switch -c <修改分支>
# 修改文件
git add <文件>
git commit -m "<修改说明>"
```

### 6. 推送到 Gitee

```bash
git push origin <修改分支>
```

首次推送会要求 Gitee 认证：用户名填 Gitee 账号，密码填第 1 步生成的私人令牌。凭据可保存到本机凭据管理器，后续推送无需重复输入。

没有主仓库写入权限时，先在 Gitee 页面 Fork 本仓库，把自己的 Fork 克隆到本地，在 Fork 中创建分支并推送，然后向主仓库发起 Pull Request。

### 7. 发起合并请求

1. 打开 Gitee 仓库页面，进入 **Pull Requests → 新建 Pull Request**。
2. 源分支选择你的修改分支，目标分支选择 `main`。
3. 填写修改说明和依据，提交后等待管理者审核合并。
4. 合并前不要删除分支；合并后可在本地切换到 `main` 并拉取更新：

```bash
git switch main
git pull --ff-only
```

### 8. 注意事项

- `git commit` 是本地操作，不需要登录 Gitee；只有 `git push` 需要认证。
- 不向 `master` 分支提交或推送；Gitee 旧 `master` 已停止使用，仅供历史追溯。
- 不在 `main` 上直接修改并推送共享规则；需要更新时按修改申请和 Pull Request 流程提出。
- 不把姓名、员工编号、访问令牌、受限业务材料提交到仓库。
- 技术检查通过不等于业务审核、3000 核对或正式发布。

更完整的命令和边界说明见 [使用者与管理者操作帮助](workflows/collaboration-guide.md)。

## 当前状态

- 已建立本地 Git 仓库及起步文件。
- 尚无正式发布版本，`manifest.json` 的正式内容清单为空。
- 日常维护以本地 `main` 为主线，将同一提交推送至 GitHub 和 Gitee 的 `main`；推送完成后，同事直接打开或克隆 Gitee 仓库即可取得主线内容。
- 同事的写入权限、分支保护、自动检查和备份任务须按各平台实际配置核对；仓库公开不表示受控协作已经开启。

当前**单流程AI完整编制包为2026-10-20.1，本轮升级已在本地准备**：统一的single-process-authoring主技能、grill-me访谈与核验、八章正文、V8 JSON、工作平衡报告和待确认事项，以及离线工具和人工交接。旧process-authoring保留兼容入口；Claude Code推荐使用带gk前缀的同包入口。方法包括材料读取边界、流程内容复核、依据追溯、成果一致性、继承性外部流程的外部单位部门与角色补充、治理会话启动时的Gitee远端版本校验及继续治理反馈。

**用户于2026-10-13确认已完成完整试用、功能无问题**，见[试用确认记录](verification/user-trial-confirmation-2026-10-13.md)；具体试用包版本与环境未登记。该确认只覆盖当时版本；2026-10-19.1新增的继承性外部流程规则及2026-10-20.1新增的启动远端版本校验规则均尚未经过完整试用。2026-10-13升级检查见[记录](verification/method-upgrade-readiness-2026-10-13.md)，2026-10-19检查见[记录](verification/method-upgrade-readiness-2026-10-19.md)，本次检查见[记录](verification/method-upgrade-readiness-2026-10-20.md)。22个虚构会话用例仍按各自记录保留未执行状态，不能由完整试用确认推定全部通过。技术合同快照仍为2026-10-08.1，V7/V8合同未改变。使用者记录取得版本的实际提交及本地修改状态；直接传文件夹须包含`.agents/`和`.claude/`。正式业务知识清单仍为空；本轮本地修改不表示已提交或推送。

## 通用方案访谈与文档同步

本库另附独立的[grill-with-docs](.agents/skills/grill-with-docs/SKILL.md)组合包`2026-10-19.1`，已在本地准备：包含同包`grilling`与`domain-modeling`，可在通用需求或方案讨论中同步记录已确认术语和重要决定。它不替代单流程编制的`grill-me`事实核验，也不修改现有编制包及技术合同。

Claude Code可用`/gk-grill-with-docs`调用[同包入口](.claude/skills/gk-grill-with-docs/SKILL.md)；Codex可用`$grill-with-docs`或按文件执行，使用时核对实际来源。共享文件夹须包含`.agents/`和`.claude/`；运行不依赖个人全局技能。来源与适配见[迁入记录](sources/grill-with-docs-import-2026-10-19.md)，技术检查见[验证记录](verification/grill-with-docs-readiness-2026-10-19.md)。真实模型会话尚未验证。

## 技能用途与调用方法

本库自带 7 个技能。Claude Code 推荐使用 gk 前缀入口，同名入口保留；使用前核对实际加载来源。下表按技能列出用途和 Claude Code 调用方式。

| 技能 | 用途 | Claude Code 调用 | 正文入口 |
|---|---|---|---|
| `single-process-authoring` | 编制或续修单个流程，产出八章正文、完整V8 JSON 以及工作平衡报告和待确认事项 | `/gk-single-process-authoring`（旧 `/single-process-authoring`、`/process-authoring` 兼容） | [SKILL.md](.agents/skills/single-process-authoring/SKILL.md) |
| `grill-me` | 首次编制逐项澄清行为、条件和办理角色；续编核验答案；新设计做情景推演 | `/gk-grill-me`（同名 `/grill-me` 保留） | [SKILL.md](.agents/skills/grill-me/SKILL.md) |
| `process-authoring` | 旧调用兼容路由，转入 `single-process-authoring` | `/process-authoring` | [SKILL.md](.agents/skills/process-authoring/SKILL.md) |
| `grill-with-docs` | 通用需求或方案访谈，同步记录已确认术语和重要决定 | `/gk-grill-with-docs`（同名 `/grill-with-docs` 保留） | [SKILL.md](.agents/skills/grill-with-docs/SKILL.md) |
| `grilling` | `grill-with-docs` 的通用方案访谈依赖，通常随组合包调用 | `/grilling` | [SKILL.md](.agents/skills/grilling/SKILL.md) |
| `domain-modeling` | `grill-with-docs` 的术语、词汇表和决定记录依赖，通常随组合包调用 | `/domain-modeling` | [SKILL.md](.agents/skills/domain-modeling/SKILL.md) |
| `lossless-pull` | 本地有未提交改动时，用 stash 备份后从 Gitee 拉取 main，恢复改动并报告冲突；仅明确要求时操作 GitHub | `/gk-lossless-pull`（同名 `/lossless-pull` 保留） | [SKILL.md](.agents/skills/lossless-pull/SKILL.md) |

单流程编制使用 `single-process-authoring`，并在首次或续编时按[会话规则](rules/process-session-rules.md)调用 `grill-me`。`grill-with-docs` 用于通用方案访谈，不承担 `grill-me` 的事实核验。

需要同步远端且本地已有未提交改动时，使用 `lossless-pull`；它默认只连 Gitee，不自动提交、推送或发布，冲突时保留 stash。本地演练见[验证记录](verification/lossless-pull-readiness-2026-10-20.md)。

Codex 等支持仓库技能的工具可用 `$技能名`，或按 `.agents/skills/<技能名>/SKILL.md` 执行；实际调用方式与读取路径记入任务记录。共享文件夹须包含 `.agents/` 和 `.claude/`。

## 同事拿到文件夹后

1. 按 [AI会话作业入口](workflows/process-ai-collaboration.md) 复制启动文本，分别填写首次／继续、梳理实际流程／设计新流程、材料及成果目录，使用[完整主技能](.agents/skills/single-process-authoring/SKILL.md)。Claude Code接DeepSeek时按[专用说明](workflows/claude-deepseek.md)，以`/gk-single-process-authoring`调用同一方法，核对实际技能来源；共享文件夹同时包含`.claude/`。
2. 首次调用同包 [grill-me](.agents/skills/grill-me/SKILL.md) 明确行为、条件和角色；续编在使用者认为当前版符合事实后逐个情景核验答案。新设计获得认可后做设计一致性与约束推演，不能记为事实已验证。详见 [会话规则](rules/process-session-rules.md)。
3. 交付八章正文、完整V8 JSON、工作平衡报告和待确认事项四项成果，另存问答、续接与交接记录。按 [V8合同](rules/process-v8-contract.md)、[技术快照](technical/snapshot.json)、[六维及周期负荷方法](.agents/skills/single-process-authoring/references/workload-method.md)及templates工作；未知事实、分数和容量不猜填。
4. 本机安装Node.js后，运行`node scripts/validate-process.cjs <JSON路径> --json`离线检查，无需Infomat仓库或npm安装。首次用`--emit-template`创建新骨架；可指定目标结构摘要，或将V7版本标识转换稿另存。用法见 [交接说明](workflows/process-handoff.md)。
5. 用户在3001核对、检查并主动下载未审核文件，再上传3000办理治理。技术通过和AI问答有据支持都不等于正式审核或发布。

配套 [虚构示例](examples/demo-process-procedure.md) 仅演示结构。技能能否原生调用、AI能否读取文件按实际工具验证；不能运行校验时明确记录未执行。方法包准备与Git共享不表示实际同事会话、目标3000启用或业务验收完成，相关结果另行记录。

当前方法与历史材料按[读取边界](rules/material-reading-boundaries.md)使用，编制时不自动展开原技能快照或全量校验代码。[会话验证指南](verification/conversation-guide.md)提供逐轮输入、独立评审标准及新目录准备命令；静态检查不计为模型通过。

编制、续编和交付复核按[依据追溯规则](rules/process-evidence-traceability.md)，在现有任务记录中登记来源实际取得情况、关键结论与四项成果对应位置及修订影响；已有准确记录直接引用。正在进行的任务保留原基线，新版采用范围和影响见[方法升级记录](sources/method-upgrade-confirmation-2026-10-13.md)。

评价草稿内容或整理继续治理反馈时，按[内容复核规则](rules/process-content-review.md)与[反馈模板](templates/process-review-feedback.md)工作。允许阶段稿继续治理，技术结果与业务完整性分开；真实案例优先，允许可定位材料和明确说明提供等效依据；理解偏差只评价具体问题和已核验范围。方法依据见[用户确认记录](sources/process-review-confirmations-2026-10-12.md)，实际检查见[准备检查记录](verification/content-review-readiness-2026-10-12.md)。

## 组织、岗位与制度职责参考

2026-10-20用户指定以《新花名册.xlsx》导入3000后的数据为真源，同步Infomat与本库。组织名称、人员所属部门与办公室归属按3000当前目录；职务、班组按3000原始导入审计。Excel仅作明确导入材料，不以当前同名原件反向覆盖3000。

- [组织架构](knowledge/organization-structure.md)：12个部门、41个office单位；部门父级空值保留，不补造领导层级。
- [岗位配置参考](knowledge/position-allocation-reference.md)：覆盖298条来源记录，保留组合及审计行定位，不含姓名、工号、OA编号或人员标识。
- [部门职能摘要](knowledge/department-functions.md)：继续按SRC-ORG-001现行制度的原确认范围使用，不从目录推定逐岗职责、任务角色或审批。
- [来源登记](sources/organization-sources.md)、[无人员标识快照](sources/organization-directory-snapshot.json)和[待确认事项](knowledge/organization-open-items.md)：记录读取时间、版本摘要、范围与差异。

2026-10-20用户已确认，职员来源第41行现任“复材二车间／调度员”。本参考已按该业务确认更正；3000当前目录及原始导入记录尚未回写。办公室仍保留原目录记录，二车间内的办公室归属未据此推定。 本次已同步本地副本，未改写业务库、原件或权限，也未启用自动同步。office与active不表示机构已正式成立。本库派生条目仍为草稿，正式有效清单保持为空；来源确认、Git共享和正式业务发布分别记录。

## 使用入口

1. 人员先阅读本页，确认访问范围及当前内容状态；维护远程协作时才查[GitHub协作准备方案](planning/github-collaboration-plan.md)，普通流程编制不展开建设历史。
2. 设计或编制流程时，使用 [AI 会话作业入口](workflows/process-ai-collaboration.md)，填写本次任务信息并取得固定版本。使用者和维护者的拉取、提交、合并与推送操作见[使用者与管理者操作帮助](workflows/collaboration-guide.md)。
3. AI 读取 [AGENTS.md](AGENTS.md)，再检查 [内容清单](manifest.json)；不能读取文件的工具由用户提供同一版本的相关内容。
4. 按任务读取相关材料；当前可使用来源索引和派生草稿辅助设计、提问和起草，不得声称已采用本库正式有效规则。具体业务材料及确认记录仍需提供。
5. 提出共享内容更新时遵循 [贡献说明](CONTRIBUTING.md)，使用 [修改申请模板](templates/change-request.md)。

原 [建设说明](planning/internal-governance-knowledge-guide.md) 保留前期讨论记录；其中固定电脑及 Gitea 部署内容不再作为当前托管方案。

同事可直接从 Gitee 默认分支克隆到自己的电脑，并记录本次使用的提交标识；推送需要取得目标仓库的写入权限：

```bash
git clone https://gitee.com/HarbinianCN/CX-Avi-Governance-Knowledge.git
cd CX-Avi-Governance-Knowledge
git rev-parse HEAD
```

发布维护者从 GitHub 拉取。本地主线为 `main`，GitHub 和 Gitee 均对应 `main`。维护者使用 `git publish` 一次推送同一提交到两端，执行[发布脚本](scripts/push-remotes.cjs)；需要本机安装 Node.js。Git 的远程配置保存在本机，不会随克隆传递，新维护副本执行一次以下配置：

```bash
git remote set-url origin https://github.com/Harbinian/CX-Avi-Governance-Knowledge.git
git fetch origin
git switch main
git config --local --replace-all remote.origin.pushurl https://github.com/Harbinian/CX-Avi-Governance-Knowledge.git
git remote add gitee https://gitee.com/HarbinianCN/CX-Avi-Governance-Knowledge.git
git config --local remote.pushDefault origin
git config --local push.default current
git config --local alias.publish "!node scripts/push-remotes.cjs"
git publish
```

已有 `gitee` 远程时，用 `git remote set-url gitee https://gitee.com/HarbinianCN/CX-Avi-Governance-Knowledge.git` 核对地址。`git publish --dry-run` 可做推送预检查，不更新远端。发布命令只推送本地 `main` 的已提交内容，不自动暂存或提交；其他分支须显式指定目标。普通 `git push` 按 Git 配置推送到 `origin`，主线双端同步使用 `git publish`。

两端推送分别执行，可能一端成功、另一端失败。维护者检查两端结果，并在失败端恢复连接或完成身份验证后重试；不得将单端成功表述为两端同步完成。单端重试可显式指定目标：

```bash
git push origin main:main
git push gitee main:main
```

GitHub 和 Gitee 的主线分支均为 `main`，各自保留初始化提交的历史并承接完整知识库；Gitee 旧 `master` 分支不再使用，仅供历史追溯。两端内容和提交按发布结果核对。

新任务可主动获取新版；正在进行的任务继续使用已记录的提交，换版前核对影响。浏览器可阅读共享文件，但 AI 是否能直接读取私有仓库需按实际工具验证。

## 目录职责

| 目录 | 内容 |
|---|---|
| rules | 用户确认的AI会话方法及技术编制约束；公司业务规则生效须有相应确认 |
| knowledge | 术语、概念及通用知识 |
| workflows | 按任务组织的 AI 作业方法 |
| templates | 编写和提交内容使用的模板 |
| examples | 脱敏示例，不作为具体业务依据 |
| sources | 来源索引、确认记录及原技能历史快照；不默认保存受限业务原件 |
| planning | 建设和部署准备材料，不作为已生效治理规则 |
| .agents/skills | single-process-authoring主技能、grill-me、process-authoring兼容入口、grill-with-docs通用组合及lossless-pull无损拉取；共享时必须包含 |
| .claude/skills | Claude Code薄壳；gk前缀入口与旧入口均指向.agents/skills唯一方法正文 |
| technical | 固定结构、共享语义校验器、预编译校验及来源摘要，供离线使用 |
| scripts | 离线校验、维护者生成与验证、显式运行的双端发布脚本，不连接业务系统 |
| verification | 技术检查记录、虚构会话输入及评审标准；未执行用例不记为模型通过 |

具体任务成果保存到使用者自己的任务目录，不直接写入共享规则、示例或技术快照。原件、材料获取及任务角色缺口仍需按本次流程落实。

## 内容边界

具体业务事实、责任和审批依据来自用户指定的原始材料及有权主体确认。Infomat 的历史文档、技术实现和 AI 输出不会因复制进本库而获得业务权威。具体案例继续按其既有治理路径办理，本库不自动读写3000或3001。

远程共享前核对 GitHub 和 Gitee 的可见性、成员权限及材料范围；正式知识发布还需明确维护人员、内容确认主体和发布记录。推送或合并不会自动使业务规则生效。允许读取仓库不等于允许把内部材料上传到任意外部 AI 服务，应使用组织允许的工具和材料范围。
