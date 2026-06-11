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
| CEO | `ceo-bezos` | 战略决策、商业模式、PR/FAQ、优先级 | claude-fable-5 |
| CTO | `cto-vogels` | 技术架构、技术选型、系统设计 | claude-opus-4-8 |
| 逆向思考 | `critic-munger` | 质疑决策、识别致命缺陷、Pre-Mortem、防止集体幻觉 | claude-fable-5 |
| 产品设计 | `product-norman` | 产品定义、用户体验、可用性 | claude-sonnet-4-6 |
| UI 设计 | `ui-duarte` | 视觉设计、设计系统、配色排版 | claude-sonnet-4-6 |
| 交互设计 | `interaction-cooper` | 用户流程、Persona、交互模式 | claude-sonnet-4-6 |
| 全栈开发 | `fullstack-dhh` | 代码实现、技术方案、开发 | claude-opus-4-8 |
| QA | `qa-bach` | 测试策略、质量把控、Bug 分析 | claude-sonnet-4-6 |
| DevOps/SRE | `devops-hightower` | 部署流水线、CI/CD、基础设施、监控运维 | claude-sonnet-4-6 |
| 营销 | `marketing-godin` | 定位、品牌、获客、内容 | claude-sonnet-4-6 |
| 运营 | `operations-pg` | 用户运营、增长、社区、PMF | claude-sonnet-4-6 |
| 销售 | `sales-ross` | 销售漏斗、转化策略 | claude-sonnet-4-6 |
| CFO | `cfo-campbell` | 定价策略、财务模型、成本控制、单位经济 | claude-opus-4-8 |
| 调研分析 | `research-thompson` | 市场调研、竞品分析、行业趋势、机会发现 | claude-fable-5 |

## 多模型架构

本项目使用多模型架构。每个 agent 在其 frontmatter 中定义了 `model` 字段。组建团队时，**必须**读取该字段并传递给 `Task` 工具。

模型层级：
- **claude-fable-5**: 战略层（CEO, Critic, Research）— 深度推理、战略分析
- **claude-opus-4-8**: 架构层（CTO, CFO, Fullstack）— 复杂架构、代码、财务模型
- **claude-sonnet-4-6**: 执行层（UI, Product, QA, DevOps, Marketing, Ops, Sales）— 快速执行、设计、测试

## 执行步骤

### 1. 分析任务，选择成员

根据任务性质，选择 2-5 个最相关的 Agent 作为团队成员。选人原则：
- **只选必要的**：不是人越多越好，精准匹配任务需求
- **考虑协作链**：如果任务涉及从设计到开发，确保链路上的关键角色都在
- **避免冗余**：职能重叠的不要同时选
- **考虑模型**：复杂战略任务优先选 claude-fable-5 模型 agent，复杂架构选 claude-opus-4-8，执行选 claude-sonnet-4-6

向创始人简要说明你选了谁、为什么选他们，以及他们各自的模型，然后立即开始组建。

### 2. 读取 Agent 定义

对每个选中的 agent，读取其 `.claude/agents/<agent-name>.md` 文件，提取：
1. **模型**: 从 frontmatter 的 `model` 字段读取（claude-fable-5 / claude-opus-4-8 / claude-sonnet-4-6）
2. **角色设定**: 文件完整内容作为 prompt 注入

### 3. 组建 Agent Team

使用 Agent Teams 功能组建临时团队：
- 创建团队，team_name 基于任务简短命名（英文、kebab-case）
- 为每个成员创建具体的任务（TaskCreate），任务描述要包含足够上下文
- **关键**：用 Task 工具 spawn 每个 teammate 时，必须指定 `model` 参数为从 agent frontmatter 读取的模型
  - `subagent_type` 选 `general-purpose`
  - `model` 选该 agent 定义的模型（claude-fable-5 / claude-opus-4-8 / claude-sonnet-4-6）
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
