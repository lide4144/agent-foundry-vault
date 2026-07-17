# Direct：直接档

## 是什么

Direct 用于“材料已经给全，只需要处理”的低风险任务，例如摘要一段文字、把列表转为 JSON、按明确规则分类。

## 入档条件

- 不需要外部事实或时效信息。
- `requested_actions` 不含 `write` 和 `execute`。
- 所有核心输入都在 task envelope 中。
- 风险等级为 `low`。

## 节点图

```text
validate → router → worker → result
```

1. `validate`：检查必填字段和权限冲突。
2. `router`：记录为什么可以走 direct。
3. `worker`：只处理已提供材料。
4. `result`：输出结果和 trace，证据账本可为空。

## 完成标准

- 所有验收条件可逐项打勾。
- 没有未授权的检索、命令或写入。
- 输出格式符合 `output_contract`。

## 升档条件

- 发现结论必须依赖任务外事实：升为 `research`。
- 发现需要修改任何持久数据：升为 `governed-write`。
- 高风险或验收标准含糊：阻断并请求人工补充。

