# Research：证据档

## 是什么

Research 用于需要检索、多源对照或处理不确定性的任务。目标不是“看起来确定”，而是让每个重要结论都能回指到证据。

## 入档条件

- `requested_actions` 含 `search`，或 `evidence_policy.min_sources > 0`。
- 任务涉及时效信息、外部事实、多源冲突或精确引用。
- 任务不要求落盘。

## 节点图

```text
validate → router → worker(收集/合成) → reviewer(证据门) → result
```

1. Worker 为每条核心 claim 建立 evidence item。
2. 冲突来源必须并列，不得悄悄选一个。
3. Reviewer 检查来源数、来源类型、冲突、采纳理由与结论语气。
4. 未验证信息只能在 `allow_unverified: true` 时保留，并必须标注。

## 完成标准

- 达到 `min_sources`，或明确说明为什么无法达到。
- 核心 claim 与 evidence item 可双向定位。
- 单源、冲突和推断没有写成已确认事实。
- Reviewer 给出 `passed`，或交给人类裁决。

## 停止与升档

- 达到预设检索轮次、连续无新证据或外部源熄断时停止。
- 不能因为“还想查查”就无限扩大范围。
- 需要把结果写回正式库时，创建新的 `governed-write` 任务，不在原查询中顺手写入。

