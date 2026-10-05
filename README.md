# 内部 AI 治理知识与规则库

本库供内部同事共享治理知识、规则、AI 作业方法和模板，作为与 AI 会话设计或编制业务流程的共同基础。2026-10-05 用户明确选择 GitHub 作为远程托管方向。本库与 Infomat 独立维护，每位同事使用自己的工作副本和任务材料。

GitHub 远程仓库：[Harbinian/CX-Avi-Governance-Knowledge](https://github.com/Harbinian/CX-Avi-Governance-Knowledge)，私有。`Governance-Knowledge` 为本库简称，本地工作副本目录可自行选择。

## 当前状态

- 已建立本地 Git 仓库及起步文件。
- 尚无正式发布版本，`manifest.json` 的正式内容清单为空。
- 已创建 GitHub 私有仓库并配置远程地址；首次推送尚未完成。
- 尚未添加同事账号，未配置分支保护、自动检查或备份任务；创建远程库不代表多人协作已经开启。

## 首批组织与职责材料

2026-10-05，用户指定外部制度PDF和员工基础信息表，并确认“制度现行，员工表仅供参考”。已准备以下本地草稿，尚未纳入正式有效清单：

- [组织架构](knowledge/organization-structure.md)：按现行制度组织图整理，保留车间名称差异。
- [部门职能摘要](knowledge/department-functions.md)：覆盖制度5.2至5.10，保留条款和PDF页码。
- [岗位配置参考](knowledge/position-allocation-reference.md)：保留参考表的部门、室／工区、班组和职务组合，未收录姓名和人员编号。
- [待确认事项](knowledge/organization-open-items.md)：记录名称、归属及资料缺口；任务角色尚未提供。
- [来源登记与确认记录](sources/organization-sources.md)：记录原件位置、版本、文件指纹和用户确认口径。

现行制度的业务依据状态与派生内容的草稿状态分别说明。岗位配置参考不能覆盖现行制度或用作任务角色任命，草稿不能宣称已按本库正式发布规则完成治理。

## 使用入口

1. 人员先阅读本页和 [GitHub 协作准备方案](planning/github-collaboration-plan.md)，确认访问范围及当前内容状态。
2. 设计或编制流程时，使用 [AI 会话作业入口](workflows/process-ai-collaboration.md)，填写本次任务信息并取得固定版本。
3. AI 读取 [AGENTS.md](AGENTS.md)，再检查 [内容清单](manifest.json)；不能读取文件的工具由用户提供同一版本的相关内容。
4. 按任务读取相关材料；当前可使用来源索引和派生草稿辅助设计、提问和起草，不得声称已采用本库正式有效规则。具体业务材料及确认记录仍需提供。
5. 提出共享内容更新时遵循 [贡献说明](CONTRIBUTING.md)，使用 [修改申请模板](templates/change-request.md)。

原 [建设说明](planning/internal-governance-knowledge-guide.md) 保留前期讨论记录；其中固定电脑及 Gitea 部署内容不再作为当前托管方案。

## 目录职责

| 目录 | 内容 |
|---|---|
| rules | 经确认的治理规则；未生效内容必须明确标为草稿 |
| knowledge | 术语、概念及通用知识 |
| workflows | 按任务组织的 AI 作业方法 |
| templates | 编写和提交内容使用的模板 |
| examples | 脱敏示例，不作为具体业务依据 |
| sources | 来源索引与确认记录，不默认保存受限原件 |
| planning | 建设和部署准备材料，不作为已生效治理规则 |

空目录仅用于本地起步定位，不添加占位文件；首次增加实际内容时再纳入 Git。

## 内容边界

具体业务事实、责任和审批依据来自用户指定的原始材料及有权主体确认。Infomat 的历史文档、技术实现和 AI 输出不会因复制进本库而获得业务权威。具体案例继续按其既有治理路径办理，本库不自动读写3000或3001。

远程共享前需确定 GitHub 仓库地址、可见性及成员权限；正式知识发布还需明确维护人员、内容确认主体和发布记录。推送或合并不会自动使业务规则生效。允许读取仓库不等于允许把内部材料上传到任意外部 AI 服务，应使用组织允许的工具和材料范围。
