---
name: team
description: "根据任务快速组建临时 AI Agent 团队协作。自动从 .claude/agents/ 中选择最合适的成员组队。支持多模型架构。"
argument-hint: "[任务描述]"
disable-model-invocation: true
---

# 组建临时团队

你需要根据下面的任务，从公司现有的 AI Agent 中挑选最合适的成员，组建一支临时团队来协作完成。

## 任务

$ARGUMENTS

## 可用 Agent

以下是公司所有 Agent，定义在 `.claude/agents/` 目录下：

| Agent | 文件 | 职能 | 模型 |
|-------|------|----------|------|
| CEO | `ceo-bezos` | 战略决策、商业模式、PR/FAQ、优先级 | gpt-5.5 / medium |
| CTO | `cto-vogels` | 技术架构、技术选型、系统设计 | gpt-5.5 / medium |
| 逆向思考 | `critic-munger` | 质疑决策、识别致命缺陷、Pre-Mortem、防止集体幻觉 | gpt-5.5 / medium |
| 产品设计 | `product-norman` | 产品定义、用户体验、可用性 | gpt-5.5 / medium |
| UI 设计 | `ui-duarte` | 视觉设计、设计系统、配色排版 | gpt-5.5 / medium |
| 交互设计 | `interaction-cooper` | 用户流程、Persona、交互模式 | gpt-5.5 / medium |
| 全栈开发 | `fullstack-dhh` | 代码实现、技术方案、开发 | gpt-5.5 / medium |
| QA | `qa-bach` | 测试策略、质量把控、Bug 分析 | gpt-5.5 / medium |
| DevOps/SRE | `devops-hightower` | 部署流水线、CI/CD、基础设施、监控运维 | gpt-5.5 / medium |
| 营销 | `marketing-godin` | 定位、品牌、获客、内容 | gpt-5.5 / medium |
| 运营 | `operations-pg` | 用户运营、增长、社区、PMF | gpt-5.5 / medium |
| 销售 | `sales-ross` | 销售漏斗、转化策略 | gpt-5.5 / medium |
| CFO | `cfo-campbell` | 定价策略、财务模型、成本控制、单位经济 | gpt-5.5 / medium |
| 调研分析 | `research-thompson` | 市场调研、竞品分析、行业趋势、机会发现 | gpt-5.5 / medium |

## 模型架构

**Coordinator**: Codex CLI with `model = "gpt-5.5"` and `model_reasoning_effort = "medium"`.
**Subagents**: Same engine/model unless a specific cycle explicitly requests a cheaper or faster tier.

**配置规则**:
- Coordinator 运行在 Codex GPT-5.5 medium.
- 所有 subagent 显式指定 `model: gpt-5.5` and `model_reasoning_effort: medium` when the subagent runtime supports those fields.
- If the runtime does not expose native subagent creation, simulate the team sequentially: read each selected agent file, perform that role's task, write its output to `docs/<role>/`, then synthesize the decision.

**注意**：The engine of record is Codex. Do not reference Claude-only model names in new cycle plans.

## 执行步骤

### 1. 分析任务，选择成员

根据任务性质，选择 2-5 个最相关的 Agent 作为团队成员。选人原则：
- **只选必要的**：不是人越多越好，精准匹配任务需求
- **考虑协作链**：如果任务涉及从设计到开发，确保链路上的关键角色都在
- **避免冗余**：职能重叠的不要同时选
- **考虑模型**：所有 agent 使用 inherit（coordinator 模型），但不同 agent 有不同专长领域

向创始人简要说明你选了谁、为什么选他们，以及他们各自的模型，然后立即开始组建。

### 2. 读取 Agent 定义

对每个选中的 agent，读取其 `.claude/agents/<agent-name>.md` 文件，提取：
1. **模型**: 从 frontmatter 的 `model` 字段读取（当前全部为 inherit）
2. **角色设定**: 文件完整内容作为 prompt 注入

### 3. 组建 Agent Team

使用 Agent Teams 功能组建临时团队：
- 创建团队，team_name 基于任务简短命名（英文、kebab-case）
- 为每个成员创建具体的任务（TaskCreate），任务描述要包含足够上下文
  - **关键**：when spawning teammates, explicitly specify `model: gpt-5.5` and `model_reasoning_effort: medium` if supported.
  - `subagent_type` 选 `general-purpose`
  - `model` 设置为 `gpt-5.5`
  - 在 prompt 中注入对应 agent 文件的完整内容作为角色设定
- spawn teammate 时通过 prompt 告知：你的角色设定、要完成的任务、产出文档存放在 `docs/<role>/` 目录下

### 4. 协调与汇总

- 作为 team lead 协调各成员工作
- 收集各成员产出，汇总为统一的结论或方案
- 如有分歧，列出各方观点供创始人决策
- 完成后清理团队资源

## 注意事项

- 所有沟通使用英文（English），技术术语保留英文，支持西班牙语（Spanish）作为第二语言
- 每个成员产出的文档按约定存放在 `docs/<role>/` 下
- 团队是临时的，任务完成后即解散
- 创始人是最终决策者，Agent 提供建议但不替代决策
- **必须**传递正确的模型参数给每个 subagent，不能全部使用 inherit 或 coordinator 的模型
