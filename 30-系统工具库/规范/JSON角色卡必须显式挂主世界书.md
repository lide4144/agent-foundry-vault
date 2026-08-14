---
type: tool
status: active
created: 2026-08-14
tags:
  - sillytavern
  - 角色卡
  - 世界书
  - mvu
source: 修女与女忍的双面日常 制卡真机验收（ST 1.18.0，2026-08-14）
---

# JSON 角色卡必须显式挂主世界书

SillyTavern 导入 **JSON 格式**角色卡时，会把 `data.character_book` 抽取成同名独立世界书文件，卡内不再保留内嵌书——且**不会**自动挂接到 `data.extensions.world`。

## 何时用

- 构建/交付 JSON 格式角色卡（凡带 character_book 的卡）。
- 导入后发现世界书不触发、MVU `[initvar]` 不初始化（无任何报错）。

## 规则

1. 卡的 `data.extensions.world` 必须设为与卡同名的世界书名（ST 抽取出的文件名即卡名）。
2. 不要假设"内嵌即自足"而留空 `world`——那是 PNG 时代部分场景的直觉，JSON 导入不成立。
3. 验收时检查两点：世界书列表里出现了同名文件；卡的 `extensions.world` 指向它。

## 常见错误

- 只查世界书文件存在就放行——文件存在 ≠ 已挂接，不挂接条目完全不注入。
- 忘记 MVU 的 `[initvar]` 也走主世界书，症状是变量永远不初始化。

## 已固化

CardMaker 项目"修女与女忍的双面日常"卡的 `build.mjs` 已默认写入 `world: CARD_NAME`。
