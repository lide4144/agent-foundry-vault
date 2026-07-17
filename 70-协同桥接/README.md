---
type: guide
status: active
created: 2026-07-17
updated: 2026-07-17
tags:
  - 协同
  - Obsidian
  - LLMWiki
  - Hermes
knowledge_class: procedural
---

# 协同桥接

这里说明 Obsidian、Hermes 内置 LLMWiki Skill、Hermes Runtime 和 Harness 如何共享同一总仓而不互相越权。

## 先确认“LLMWiki”指什么

本仓的 LLMWiki 指 Hermes 内置的 Markdown Skill：它按 SCHEMA、index、log、raw、concepts、entities、comparisons 和 queries 维护互链 Markdown。

它不是同名的 SQLite、Web UI 或 MCP 产品。本仓默认不混装同名产品；若以后选择另一实现，要单独做迁移、缓存、数据库、MCP 权限和故障方案。

## 何时用

- 第一次连接 Obsidian 与 Hermes 时。
- 准备开放自动写回、同步或远程运行时。
- 出现并发覆盖、同步冲突、LLMWiki 越界或恢复问题时。

## 三步操作

1. 选路径模式：默认同根，或经过迁移的严格隔离。
2. 按责任矩阵和写域设置权限，所有正式写回走状态机。
3. 只启用一个提交 writer，并准备独立备份与故障 Runbook。

## 默认模式

当前仓使用：

~~~text
WIKI_PATH = OBSIDIAN_VAULT_PATH = Agent Foundry Vault智能体工坊根目录
~~~

这样兼容 Hermes 内置 LLMWiki 的根目录协议。下列是本仓的逻辑允许范围：

- raw：只能创建新的不可变来源快照，不能覆盖既有文件；
- concepts；
- entities；
- comparisons；
- queries；
- index.md；
- log.md。

系统工具、创意库、Hermes 运维和治理文件不属于 LLMWiki 自动写域。

这里必须区分“规则”与“强制”：`AGENTS.md` 和 `policies/permissions.json` 是本仓/Harness 的治理契约，不会自动变成 Hermes 文件系统沙箱；示例中的终端、Skill 与 memory 审批也不是普通 Wiki 文件的全局写审批。未配置受限 adapter、操作系统 ACL、只读挂载或隔离运行配置前，Hermes 默认只做读取和候选提案，正式文件由人审阅后提交，不能声称已技术强制写域。

## 阅读顺序

1. [责任矩阵](责任矩阵.md)
2. [路径配置](路径配置.md)
3. [LLMWiki 写域](LLMWiki写域.md)
4. [写回状态机](写回状态机.md)
5. [单写者与乐观锁](单写者与乐观锁.md)
6. [同步与备份](同步与备份.md)
7. [故障 Runbook](故障Runbook.md)

## 完成标准

- [ ] LLMWiki 实现已明确，不混装同名产品。
- [ ] WIKI_PATH 与 OBSIDIAN_VAULT_PATH 指向已核对。
- [ ] 每个组件的可写路径已定义。
- [ ] 已区分指令治理与真实文件系统强制；自动正式写回默认关闭。
- [ ] 同一目标只有一个提交 writer。
- [ ] 有 Vault 外备份并做过恢复演练。

## 常见错误

- 因为路径同根，就让 LLMWiki 改整个 Vault。
- 把 Obsidian Sync 当备份。
- 两台 Agent 主机同时直接改 index.md 和 log.md。
- 示例配置存在就声称 Hermes、LLMWiki 或同步已经安装。
