# Governed Write：受控写入档

## 是什么

Governed Write 把写操作分成“提案、审批、实施、验证”四个阶段。本最小 harness 只运行到变更提案与审查，默认不写盘。

## 入档条件

- `requested_actions` 含 `write` 或 `execute`。
- 任务提供 `write_gate.target_paths` 和 `approval_state`；执行任务要列出脚本、工作目录或受控端点。
- 目标、验收标准和禁止区明确。

## 节点图

```text
validate → router → worker(准备内容) → writer(变更提案)
        → reviewer(证据/范围/回滚检查) → human approval
        → real adapter apply → read-back verify → rollback or close
```

## 当前实现的边界

- `core.mjs` 在内存中返回 `change-proposal`。
- `runTask()` 会在任何节点调用前拒绝未声明 `appliesChanges: false` 的 adapter。
- 即使 `approval_state` 是 `approved`，最小内核也不拥有文件写入能力。
- 真实写入必须由将来的独立、受限实施进程完成，并单独测试；不能把它伪装成只读 adapter 接回本内核。
- Mock adapter 只证明写入门没被绕过，不证明 diff 内容正确。

## 变更提案必须包含

1. 精确目标。
2. 改动理由。
3. 预期变更清单或 diff。
4. 写后验证。
5. 回滚方法。
6. 审批状态和审批引用（如有）。

## 硬门禁

- 目标路径不明确：阻断。
- 超出 `target_paths`：阻断。
- 属于 raw、备份、秘密或局部禁止区：阻断。
- 无 diff/无验证/无回滚：阻断。
- 未审批：只能返回 `needs-approval`。
- 实施后未回读：不得标记完成。
