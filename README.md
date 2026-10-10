# 内部 AI 治理知识与规则库

本库供内部同事共享治理知识、规则、AI 作业方法和模板，作为与 AI 会话设计或编制业务流程的共同基础。2026-10-05 用户明确选择 GitHub 作为远程托管方向。本库与 Infomat 独立维护，每位同事使用自己的工作副本和任务材料。

GitHub 远程仓库：[Harbinian/CX-Avi-Governance-Knowledge](https://github.com/Harbinian/CX-Avi-Governance-Knowledge)，私有。`Governance-Knowledge` 为本库简称，本地工作副本目录可自行选择。

## 当前状态

- 已建立本地 Git 仓库及起步文件。
- 尚无正式发布版本，`manifest.json` 的正式内容清单为空。
- 已完成首次提交并推送至 GitHub 私有仓库的 `main` 分支。
- 尚未添加同事账号，未配置分支保护、自动检查或备份任务；创建远程库不代表多人协作已经开启。

当前**单流程AI完整编制包为2026-10-10.1，本地准备状态**：统一的single-process-authoring主技能、grill-me访谈与核验、八章正文、V8 JSON、工作平衡报告和待确认事项，以及离线工具和人工交接。旧process-authoring保留兼容入口；Claude Code推荐使用带gk前缀的同包入口。本轮补齐材料读取边界与16个虚构会话用例，真实DeepSeek会话未执行。技术合同快照仍为2026-10-08.1，V7/V8合同未改变。当前本地更新尚未提交或推送，远程既有版本不包含本轮新增内容；直接传文件夹须包含`.agents/`和`.claude/`。正式业务知识清单仍为空。

## 同事拿到文件夹后

1. 按 [AI会话作业入口](workflows/process-ai-collaboration.md) 复制启动文本，分别填写首次／继续、梳理实际流程／设计新流程、材料及成果目录，使用[完整主技能](.agents/skills/single-process-authoring/SKILL.md)。Claude Code接DeepSeek时按[专用说明](workflows/claude-deepseek.md)，以`/gk-single-process-authoring`调用同一方法，核对实际技能来源；共享文件夹同时包含`.claude/`。
2. 首次调用同包 [grill-me](.agents/skills/grill-me/SKILL.md) 明确行为、条件和角色；续编在使用者认为当前版符合事实后逐个情景核验答案。新设计获得认可后做设计一致性与约束推演，不能记为事实已验证。详见 [会话规则](rules/process-session-rules.md)。
3. 交付八章正文、完整V8 JSON、工作平衡报告和待确认事项四项成果，另存问答、续接与交接记录。按 [V8合同](rules/process-v8-contract.md)、[技术快照](technical/snapshot.json)、[六维及周期负荷方法](.agents/skills/single-process-authoring/references/workload-method.md)及templates工作；未知事实、分数和容量不猜填。
4. 本机安装Node.js后，运行`node scripts/validate-process.cjs <JSON路径> --json`离线检查，无需Infomat仓库或npm安装。首次用`--emit-template`创建新骨架；可指定目标结构摘要，或将V7版本标识转换稿另存。用法见 [交接说明](workflows/process-handoff.md)。
5. 用户在3001核对、检查并主动下载未审核文件，再上传3000办理治理。技术通过和AI问答有据支持都不等于正式审核或发布。

配套 [虚构示例](examples/demo-process-procedure.md) 仅演示结构。技能能否原生调用、AI能否读取文件按实际工具验证；不能运行校验时明确记录未执行。当前包提供本地准备，实际同事会话、目标3000启用和业务验收另行记录。

当前方法与历史材料按[读取边界](rules/material-reading-boundaries.md)使用，编制时不自动展开原技能快照或全量校验代码。[会话验证指南](verification/conversation-guide.md)提供逐轮输入、独立评审标准及新目录准备命令；静态检查不计为模型通过。

## 首批组织与职责材料

2026-10-05，用户指定外部制度PDF和员工基础信息表，并确认“制度现行，员工表仅供参考”。已准备以下本地草稿，尚未纳入正式有效清单：

- [组织架构](knowledge/organization-structure.md)：按现行制度组织图整理，保留车间名称差异。
- [部门职能摘要](knowledge/department-functions.md)：覆盖制度5.2至5.10，保留条款和PDF页码。
- [岗位配置参考](knowledge/position-allocation-reference.md)：保留参考表的部门、室／工区、班组和职务组合，未收录姓名和人员编号。
- [待确认事项](knowledge/organization-open-items.md)：记录名称、归属及资料缺口；任务角色尚未提供。
- [来源登记与确认记录](sources/organization-sources.md)：记录原件位置、版本、文件指纹和用户确认口径。

现行制度的业务依据状态与派生内容的草稿状态分别说明。岗位配置参考不能覆盖现行制度或用作任务角色任命，草稿不能宣称已按本库正式发布规则完成治理。

## 使用入口

1. 人员先阅读本页，确认访问范围及当前内容状态；维护远程协作时才查[GitHub协作准备方案](planning/github-collaboration-plan.md)，普通流程编制不展开建设历史。
2. 设计或编制流程时，使用 [AI 会话作业入口](workflows/process-ai-collaboration.md)，填写本次任务信息并取得固定版本。
3. AI 读取 [AGENTS.md](AGENTS.md)，再检查 [内容清单](manifest.json)；不能读取文件的工具由用户提供同一版本的相关内容。
4. 按任务读取相关材料；当前可使用来源索引和派生草稿辅助设计、提问和起草，不得声称已采用本库正式有效规则。具体业务材料及确认记录仍需提供。
5. 提出共享内容更新时遵循 [贡献说明](CONTRIBUTING.md)，使用 [修改申请模板](templates/change-request.md)。

原 [建设说明](planning/internal-governance-knowledge-guide.md) 保留前期讨论记录；其中固定电脑及 Gitea 部署内容不再作为当前托管方案。

取得访问权限后，可将仓库克隆到自己的电脑，并记录本次使用的提交标识：

```bash
git clone https://github.com/Harbinian/CX-Avi-Governance-Knowledge.git
cd CX-Avi-Governance-Knowledge
git rev-parse HEAD
```

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
| .agents/skills | single-process-authoring主技能、grill-me及process-authoring兼容入口；共享时必须包含 |
| .claude/skills | Claude Code薄壳；gk前缀入口与旧入口均指向.agents/skills唯一方法正文 |
| technical | 固定结构、共享语义校验器、预编译校验及来源摘要，供离线使用 |
| scripts | 离线校验、维护者生成与验证脚本，不自动连接业务系统 |
| verification | 技术检查记录、虚构会话输入及评审标准；未执行用例不记为模型通过 |

具体任务成果保存到使用者自己的任务目录，不直接写入共享规则、示例或技术快照。原件、材料获取及任务角色缺口仍需按本次流程落实。

## 内容边界

具体业务事实、责任和审批依据来自用户指定的原始材料及有权主体确认。Infomat 的历史文档、技术实现和 AI 输出不会因复制进本库而获得业务权威。具体案例继续按其既有治理路径办理，本库不自动读写3000或3001。

远程共享前需确定 GitHub 仓库地址、可见性及成员权限；正式知识发布还需明确维护人员、内容确认主体和发布记录。推送或合并不会自动使业务规则生效。允许读取仓库不等于允许把内部材料上传到任意外部 AI 服务，应使用组织允许的工具和材料范围。
