# 运行记录

运行记录回答“这次任务实际经历了什么”。它是运维数据，不是 Obsidian 正文，也不是 Agent 的 SOUL。

## 一次运行的三件套

`runTask()` 在内存中返回：

- `result`：最终状态、输出、审查和指标。
- `trace`：按顺序记录校验、路由、节点和门禁。
- `evidenceLedger`：核心 claim 的来源、置信度、冲突和采纳理由。

三者使用相同的 `task_id` 和 `trace_id` 关联。

## 默认不写盘

`core.mjs` 和 mock adapter 不导入文件系统模块，也不会自动创建本目录下的日志。这使得 smoke 和训练回放不会污染工作区。

如果将来增加记录器，必须：

1. 由调用者显式启用，不是默认行为。
2. 一行一个 JSON 对象，只追加，不改历史。
3. 记录 runtime/schema/adapter/模型/训练集版本。
4. 输入中的密钥、令牌、私人数据先脱敏。
5. 文件名与路径不得伪装成已存在的运行记录。
6. 写完后回读并验证 JSON；失败不得标记为已记录。

## 最小查错顺序

1. 先看 `result.status` 和 `warnings`。
2. 在 trace 找第一个 `failed` 或 `blocked` 事件。
3. 核对当时节点输入和角色契约。
4. Research 问题再看 evidence ledger 的冲突与验证状态。
5. 定位是数据、路由、adapter、审查还是规则故障，不要一次全改。

