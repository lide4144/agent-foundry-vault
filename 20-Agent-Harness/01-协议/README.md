# 协议说明

“协议”是 Agent 节点之间交接数据的固定格式。格式稳定后，才能回放、比较和查错。

| 文件 | 回答的问题 |
|---|---|
| `task-envelope.schema.json` | 这是什么任务，允许做什么，怎样算完成？ |
| `trace.schema.json` | 任务经过了哪些节点，每步成功还是失败？ |
| `evidence-ledger.schema.json` | 结论依据什么，是否冲突，为什么采纳？ |
| `result.schema.json` | 最终输出、审查状态和成本是什么？ |

## 最小规则

- `task_id` 识别任务；`trace_id` 识别某一次运行。同一任务重跑时，`task_id` 可不变，`trace_id` 应变。
- `requested_actions` 中有 `write` 或 `execute` 时，必须走 `governed-write` 并提供 `write_gate`；执行目标可写脚本路径、工作目录或受控端点。
- 证据账本与人类笔记分开，不把大段机器轨迹塞进 Obsidian 正文。
- Smoke 会用本仓的关键字子集校验器套用四份 Schema；Schema 只证明“形状对”，不证明“内容真”。
