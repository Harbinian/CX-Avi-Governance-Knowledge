# 使用者与管理者操作帮助

本文面向两类用户：使用本库编制流程的同事（使用者），以及负责审核、合并和按授权发布的维护者（管理者）。命令以本机已安装 Git 和 Node.js 为前提；实际写入权限以托管平台配置为准。

## 角色与边界

| 角色 | 主要操作 | 边界 |
|---|---|---|
| 使用者 | 克隆或拉取、阅读材料、编制流程、在任务目录保存成果、提出修改申请 | 不在 `main` 上直接改写共享规则、模板、示例或技术快照；需要更新时按修改申请和 Pull Request 流程提出 |
| 管理者 | 审核修改、合并分支或 Pull Request、按授权推送、核对远端、维护平台设置 | 合并和技术检查通过不等于业务批准或正式发布 |

Gitee 和 GitHub 的主线分支均为 `main`。Gitee 旧 `master` 分支已停止使用，仅供历史追溯。

## 一、使用者

### 1. 首次获取

```bash
git clone https://gitee.com/HarbinianCN/CX-Avi-Governance-Knowledge.git
cd CX-Avi-Governance-Knowledge
git rev-parse HEAD
```

Gitee 默认分支为 `main`。记录当前提交标识，作为本次使用的版本基线。

### 2. 校验远端版本与日常拉取更新

开始治理工作前先核对 Gitee 远端 `main`，确认本地基线。本维护副本的 Gitee 远程名为 `gitee`；从 Gitee 克隆的副本通常为 `origin`，以 `git remote -v` 的实际地址为准：

```bash
git remote -v
git rev-parse HEAD
git fetch gitee main
git rev-parse FETCH_HEAD
git rev-list --left-right --count HEAD...FETCH_HEAD
```

`rev-list` 输出为“本地独有提交数　远端独有提交数”。本地落后、领先或分叉时，先按[会话规则](../rules/process-session-rules.md)报告并由用户决定；落后且用户确认后，按[无损拉取](../.agents/skills/lossless-pull/SKILL.md)或以下快进命令更新：

```bash
git pull --ff-only
```

拉取前工作区应为 clean；有本地修改时先按无损拉取备份。`--ff-only` 可避免自动生成合并提交。核对和拉取默认只连接 Gitee。

### 3. 在 Claude Code 中编制流程

1. 按 [AI会话作业入口](process-ai-collaboration.md) 复制启动文本，填写首次／继续、梳理实际流程／设计新流程、材料及成果目录。
2. 使用 `/gk-single-process-authoring` 调用同包方法，并核对实际技能来源；访谈按 [会话规则](../rules/process-session-rules.md) 调用同包 grill-me。
3. 四项成果写入自己的任务目录，不写入共享规则、示例或技术快照。
4. 需要拉取更新时，可在会话中输入：

```text
! git pull --ff-only
```

### 4. 提交修改

`git commit` 是本地操作，不需要登录 Gitee；只有 `git push` 需要认证。

修改共享知识、规则、方法或模板前，先按 [贡献说明](../CONTRIBUTING.md) 和 [修改申请模板](../templates/change-request.md) 记录修改原因、依据、适用范围和影响条目。

有写入权限时，在独立分支修改并推送：

```bash
git switch -c <修改分支>
# 修改文件
git add <文件>
git commit -m "<修改说明>"
git push origin <修改分支>
```

然后在 Gitee 或 GitHub 向 `main` 发起 Pull Request，由管理者审核合并。

没有写入权限时：

- Fork 仓库，在自己的 Fork 中修改并推送，再向主仓库发起 Pull Request；或
- 将修改申请、修改内容和依据交给管理者处理。

### 5. 需要更新共享规则时

“不直接改写共享规则”是指不在 `main` 上直接修改并推送，不是不能提出更新。使用者发现规则、模板或方法需要调整时：

1. 先判断是否属于共享内容：会影响其他同事的规则、模板、技能、`manifest.json` 或示例，按共享规则处理；只影响本次流程任务的成果，写入自己的任务目录。
2. 按 [贡献说明](../CONTRIBUTING.md) 和 [修改申请模板](../templates/change-request.md) 记录修改原因、依据及定位、适用范围、影响条目和待确认事项。
3. 有写入权限时，从最新 `main` 创建独立分支，完成修改并提交：

```bash
git switch main
git pull --ff-only
git switch -c rule-update/<主题>
# 修改共享规则及受影响模板、入口
git add <文件>
git commit -m "<修改说明>"
git push origin rule-update/<主题>
```

4. 在 Gitee 或 GitHub 向 `main` 发起 Pull Request，附修改申请和依据。
5. 没有写入权限时，Fork 后按同样方式推送并发起 Pull Request，或把修改申请、修改内容和依据交给管理者。
6. 规则变更涉及方法时，按贡献说明同步主技能、模板、受影响的 Claude 入口和 `manifest.json`；涉及公司业务规则时，需有权主体确认，合并本身不等于规则生效。

### 6. 使用者的禁止事项

- 不在 `main` 上直接修改并推送共享规则；需要更新时按上一节流程提出。
- 不向 `master` 分支提交或推送；该分支已停止使用。
- 不把姓名、员工编号、访问令牌、受限业务材料提交到仓库。
- 不把本地技术检查通过表述为业务审核、3000 核对或正式发布。
- 不直接改写共享规则、技术快照、示例或他人任务成果。

本轮版本将方法、工具和已审阅的实际数据库字典一同纳入Git。拉取后按[同步与使用](database-knowledge-sharing.md)检查随库字典，无需另行索取ZIP；原始审计及取数材料仍不随库分发。

## 二、管理者

### 1. 认证与凭据

- 本地 `git commit` 不需要登录；`git push` 才需要 Gitee/GitHub 认证。
- 凭据保存在本机凭据管理器。令牌吊销、过期或凭据被清除后，推送时重新认证并保存。
- 不在仓库文件、对话记录或命令历史中写入访问令牌。

### 2. 日常同步

默认从Gitee同步，先核对远程地址和本地改动：

```bash
git switch main
git pull --ff-only gitee main
```

从Gitee克隆的副本通常使用origin。仅在用户明确指定GitHub时，才连接指向GitHub的远程，不默认从GitHub拉取。

### 3. 审核与合并

#### 方式 A：通过 Gitee Pull Request 合并

1. 审核 Pull Request 的修改申请、依据、适用范围和实际差异。
2. 确认目标分支为 `main`。
3. 审核通过后在 Gitee 页面点击合并；实质业务变化仍需有权主体确认。
4. 本地同步合并结果：

```bash
git switch main
git pull --ff-only gitee main
```

5. 核对Gitee合并结果。只有用户明确要求GitHub时，才继续双端发布：

```bash
git publish
```

#### 方式 B：本地合并分支

```bash
git fetch gitee
git merge --no-ff gitee/<同事分支>
# 检查差异、解决冲突并运行必要检查
git push gitee main:main
```

明确要求GitHub时，再执行双端发布；不从本地合并自动推定该授权。

### 4. 合并后检查

```bash
node scripts/check-package.cjs
node scripts/test-offline-package.cjs
git ls-remote gitee refs/heads/main
```

- 修改 Markdown、`manifest.json` 或技能文件后，先运行 `check-package.cjs`。
- 修改 `scripts/*.cjs` 后，重跑对应测试脚本。
- 默认核对Gitee；明确执行双端发布时，另核对GitHub并比较两端main，不把单端成功表述为双端完成。

### 5. 推送与失败处理

默认显式推送到Gitee：

```bash
git push gitee main:main
```

用户明确要求GitHub与Gitee双端时，使用`git publish`，或分别推送：

```bash
git push origin main:main
git push gitee main:main
```

两端推送分别执行，可能一端成功、另一端失败。失败端恢复连接或完成身份验证后重试；重试前核对远端是否已被其他提交更新。

### 6. 平台设置

如需受控协作，应在 Gitee 和 GitHub 实际配置并验证：

- 保护 `main` 分支，禁止直接推送；
- 要求通过 Pull Request 合并并指定审核人；
- 可选的自动检查和标签保护。

当前仓库未核对或启用上述控制，不能把本文建议表述为已经生效的审批流程。提交者、审核者和维护者的具体人员另行指定。

### 7. 状态边界

合并、技术检查通过、用户确认事实、3000 部门核对、正式审核和发布分别记录，互不替代。不把本地准备、提交或推送表述为已批准、已验收或已发布。

## 三、命令速查

| 目的 | 使用者 | 管理者 |
|---|---|---|
| 首次获取 | `git clone https://gitee.com/HarbinianCN/CX-Avi-Governance-Knowledge.git` | 同左，或从 GitHub 拉取 |
| 拉取更新 | `git pull --ff-only` | `git pull --ff-only origin main` 或 `git pull --ff-only gitee main` |
| 本地提交 | `git add <文件>`、`git commit -m "<说明>"` | 同左 |
| 推送修改 | `git push origin <分支>`（远程须指向Gitee，需权限） | 默认`git push gitee main:main`；双端需明确要求 |
| 发起合并 | 在 Gitee/GitHub 发起 Pull Request 到 `main` | 审核后合并，并同步本地 |
| 检查包一致性 | 不需要 | `node scripts/check-package.cjs` |
| 核对远端 | `git rev-parse HEAD` | `git ls-remote origin refs/heads/main`、`git ls-remote gitee refs/heads/main` |

## 四、相关文档

- [README](../README.md)：仓库状态、目录职责和远程配置。
- [贡献说明](../CONTRIBUTING.md)：修改申请、共性改进和合并流程。
- [AI会话作业入口](process-ai-collaboration.md)：流程编制启动文本。
- [会话规则](../rules/process-session-rules.md)：首次／续编及外部流程的访谈规则。
- [人工交接说明](process-handoff.md)：3001 导入、下载和 3000 上传边界。
