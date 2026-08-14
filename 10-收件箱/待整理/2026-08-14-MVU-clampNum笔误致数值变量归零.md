---
type: inbox
status: draft
created: "2026-08-14"
tags: ["mvu", "zod", "schema", "clamp", "变量", "踩坑", "数值归零"]
source: "CardMaker 制卡「天际·龙裔之路」运行时调试；旧卡「修女与女忍」zod_schema.js 对照"
---

# MVU Zod 里 clampNum 写错 Math.min/Math.max 导致数值变量全归零

## 这是什么

zod_schema.js 里 clamp 辅助函数把下限写成 `Math.min(min, v)`（应为 `Math.max(min, v)`），导致所有数值字段被压成 0：`clamp(0,100)(100) = Math.min(100, Math.min(0,100)) = 0`。字符串字段正常、数值全 0，看起来像"变量没落地"。

## 为什么值得留下

- 症状极其隐蔽：字符串（位置/进度）一直在正确更新，只有数值归零，第一眼会误判成"MVU 没解析 UpdateVariable"。
- 一个字符的 bug，却让生命/法力/耐力/技能全部失效。
- 更深教训：这行是从旧卡「修女与女忍」复制的，但**旧卡从未真机验收过**，其"成熟方言"里埋着这个笔误——复用别人未验证的代码时，一行行比对不能省。

## 原始信息与自己的判断

**原始信息（对照）：**

```js
// 错（天际卡）：Math.min(min, v) → 永远取最小值，全归零
const clampNum = (min, max) => v => Math.min(max, Math.min(min, v));
// 对（修女卡）：Math.max(min, v)
const clampNum = (min, max) => v => Math.min(max, Math.max(min, v));
```

- 定位手段：读聊天文件 `.jsonl` 每条消息的 `variables` 字段，直接看 `stat_data` 各字段值。发现字符串正确、数字全 0，立刻怀疑 transform/clamp，而非 MVU 加载。
- 佐证：`Level` 字段用 `Math.max(1, Math.min(MAX, v))`（正确写法）→ 等级正常显示 1；用 clampNum 的字段全 0。

**我的判断：**

- 写 clamp 就一个原则：`Math.min(max, Math.max(min, v))`，下限必须 `Math.max`。
- 复用的"成熟模式"若未真机验证，等于自带地雷；制卡流程最后一步"真机验收"不可省。

## 下一步

- [ ] 整理为工具卡：zod_schema.js 标准模板 + clamp 正确写法（对比 STDB B1 §7.1）
- [ ] 待核对：旧卡「修女与女忍」是否也需同步修这个 bug（它复用的同一行）
