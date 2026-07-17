---
type: dashboard
status: active
created: 2026-07-17
tags:
  - 看板
  - Dataview
source: 本仓说明
---

# 可选：Dataview 看板

Dataview 是社区插件。本仓不要求安装；没有插件时，下面代码只会作为普通文本显示，不影响其他页面。

## 何时用

已经积累了一批真实笔记，并且手工看板确实无法满足查询需求时。

## 三步操作

1. 先确认 [[80-看板与索引/手工看板]] 已能正常使用。
2. 自行评估社区插件来源与权限后，再决定是否安装 Dataview。
3. 每次只启用一个查询，核对结果后再继续添加。

## 示例一：待整理收件箱

```dataview
TABLE type, status, created, source
FROM "10-收件箱"
WHERE status != "archived"
SORT created DESC
```

## 示例二：写回候选

```dataview
TABLE status, created, source
FROM "10-收件箱/写回候选"
SORT created DESC
```

## 示例三：待复核 Wiki 条目

```dataview
TABLE type, status, created, source
FROM "concepts" OR "entities" OR "comparisons" OR "queries"
WHERE status = "candidate"
SORT created DESC
```

这些查询只读取首周五字段，不要求在笔记中加入机器运行字段。

## 完成标准

- [ ] 关闭插件后仍能用手工看板工作。
- [ ] 查询只读，不触发自动写回。
- [ ] 查询结果与实际文件抽样一致。
- [ ] 没有为了看板增加无意义字段。

## 常见错误

- 把查询无结果误认为文件不存在。
- 未统一字段拼写就开始写复杂查询。
- 让自动查询结果直接修改主库。
- 从不核对插件升级后的行为变化。
