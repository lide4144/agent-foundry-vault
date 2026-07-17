---
type: policy-guide
status: active
created: 2026-07-17
tags:
  - LLMWiki
knowledge_class: procedural
---

# LLMWiki 写域

## 何时用

Hermes 要摄入来源、生成 Wiki 页面、更新索引或做 lint 时。

## 三步操作

1. 每次先读 AGENTS.md、SCHEMA.md、index.md 和 recent log.md。
2. 将动作限制到下表；超出范围改为候选建议。
3. 回读页面、索引和日志，再做断链与来源检查。

## 允许范围

下表定义逻辑写域，不代表 Hermes 已自动执行 `permissions.json`。在同根模式且没有 OS/容器/受限 adapter 强制时，只生成候选，不自动提交正式文件。

| 路径 | 允许动作 | 额外条件 |
|---|---|---|
| raw/** | 只创建新来源快照 | 既有文件永不覆盖；记录来源、日期和哈希 |
| concepts/** | 候选创建或受控更新 | 事实必须有 sources |
| entities/** | 候选创建或受控更新 | 先查重复实体 |
| comparisons/** | 候选创建或受控更新 | 保留冲突双方和采用理由 |
| queries/** | 保存值得重建成本的综合查询 | 不保存一次性闲聊 |
| index.md | 与正式页面同一变更集更新 | 不单独提前写 |
| log.md | 只追加实际动作和验证 | 不写秘密、Token 或完整私聊 |

## 禁止范围

- 30-系统工具库；
- 50-创意库；
- 60-Hermes运维；
- 70-协同桥接；
- AGENTS.md、SCHEMA.md、policies、scripts；
- 实际 Hermes HOME、密钥、记忆和大 trace。

用户明确授权某个精确文件时，仍要遵守目标目录局部规则；LLMWiki 身份本身不会扩大权限。

## 同名产品提醒

此规则只约束 Hermes 内置 Markdown LLMWiki Skill。若接入带 SQLite、MCP 或 Web 服务的同名产品，必须先单独评估数据库位置、缓存、MCP 凭证、网络和双写风险。

## 完成标准

- [ ] 写入没有越界。
- [ ] 若声称“强制限制”，已有 ACL、只读挂载、隔离 profile/container 或受限 adapter 的真实验证证据。
- [ ] raw 旧快照未改。
- [ ] 页面、index 和 log 一致。
- [ ] 事实来源可定位。

## 常见错误

- 把 raw 的纠错写回原快照。
- 摄入一次就批量改十几个页面而不审批。
- 同时运行两套 LLMWiki 实现写同一个目录。
