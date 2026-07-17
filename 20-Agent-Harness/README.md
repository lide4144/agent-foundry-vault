# Agent Harness：从一个可回放任务开始

Agent Harness 是一套“怎样让 Agent 接任务、选路径、留证据、做审查”的规则与最小运行器。它不是模型，也不会让模型自动变聪明。

## 先记住四个词

- **协议**：任务、轨迹、证据和结果的固定数据格式。
- **角色契约**：某个节点可以做什么、不可以做什么。
- **工作流**：一个任务会经过哪些节点。
- **回放**：用同一个测试案例重跑，判断改动是变好还是变差。

## 三档运行路径

| 档位 | 适合任务 | 默认角色 | 是否允许落盘 |
|---|---|---|---|
| `direct` | 给定内容的摘要、分类、转换 | router → worker | 否 |
| `research` | 需要外部来源、多源对照的查询 | router → worker → reviewer | 否 |
| `governed-write` | 想改文件、知识库或配置 | router → worker → writer → reviewer | 默认只生成变更提案 |

`governed-write` 必须把“准备改什么”与“已经获得批准”分开。本仓的最小运行器不实施写入。

## 目录地图

- `01-协议/`：JSON Schema 和字段的白话说明。
- `02-角色/`：router、worker、reviewer、writer 的最小契约。
- `03-工作流/`：三档任务图与训练闭环。
- `04-训练集/`：可离线回放的种子案例。
- `05-评测/`：指标、评分规则与 A/B 升级门。
- `06-运行记录/`：如何保存 trace，不污染新人笔记。
- `07-复盘升级/`：如何从失败案例到可验证升级。
- `../harness/`：仅用 Node.js 内置模块编写的最小运行器。

## 第一次使用

在总仓根目录打开 PowerShell，先跑完整冒烟，再展开第一条案例：

```powershell
node scripts/harness-smoke.mjs
node scripts/show-first-seed.mjs
```

第二条命令会自行读取 `04-训练集/seed-cases.jsonl` 第一行，依次调用 `validateTask()`、`routeTask()`、`runTask()`，并打印路由、结果和精简 trace；无需自己补一个未定义的 `task`。随后可打开 `scripts/show-first-seed.mjs`，按同一结构替换成自己的任务信封。

## mock 能证明什么

deterministic mock adapter 对相同输入给出相同结果，适合检查路由、节点顺序、四类 Schema 和写入门禁。冒烟会把 task、result、trace、evidence ledger 逐一套用本仓的无依赖校验器。

`harness/schema-validator.mjs` 只实现本仓四份 Schema 当前实际使用的关键字子集，不是可复用到任意 Draft 2020-12 Schema 的通用引擎；Schema 增加关键字时，必须同时扩展校验器和失败案例。

**mock 不证明模型的事实正确性、推理质量、创作质量或工具真实可用性。** 接入真正模型后，仍要用固定训练集、证据审查和 A/B 基线重新评测。

当前 `runTask()` 只接受明确声明 `appliesChanges: false` 的只读/提案 adapter，并在调用它之前检查该声明。这个声明能防止误接实现型 adapter，但不是恶意代码的安全沙箱；真正实施变更必须放到独立进程，在人工审批后按最小文件系统和网络权限运行。
