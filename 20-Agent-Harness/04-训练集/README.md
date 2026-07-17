# 训练集

训练集是一批固定的任务题。它用来回放和 A/B 比较，不是 Agent 的持久记忆。

## JSONL 是什么

JSONL 是“每行一个完整 JSON 对象”。`seed-cases.jsonl` 的每行包含：

- `case_id`：测试题的稳定编号。
- `description`：人类能读懂的测试意图。
- `task`：应通过 task envelope 校验的真实输入。
- `expectations`：路由、状态、角色顺序和硬门禁。

## 使用规则

1. 基线 A 和候选 B 必须跑同一份文件。
2. 运行前记录训练集版本或哈希。
3. 不要为让某次结果通过而临时改 expectations。
4. 新案例先进候选区；复核后才进基准集。
5. 这些案例与 mock 只检查管线。接入真模型时，必须增加真实正确性和人工评审。

## 首批覆盖

- Direct：只处理用户已给文本。
- Research：要求两个来源和 reviewer。
- Governed Write：只产生提案，待审批时不得落盘。

