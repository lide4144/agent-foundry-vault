---
type: guide
status: active
created: 2026-07-17
tags:
  - Wiki
  - 导航
source: 本仓说明
---

# Wiki 知识库怎么用

这里是人类可读的说明与导航区。为兼容 LLMWiki，正式数据不放在本目录，而放在 Vault 根目录的五个保留目录中。

## 何时用

- 想把收件箱资料整理成长期知识。
- 不确定内容属于概念、实体、对比还是查询。
- 准备让 LLMWiki 索引知识前，想确认目录与写回边界。

## 三步操作

1. 先读 [[40-Wiki知识库/概念与实体怎么判断]]，确定条目类型。
2. 用 `templates/模板-概念卡.md`、`模板-实体卡.md`、`模板-对比卡.md` 或 `模板-查询卡.md` 建候选，先放入 `10-收件箱/写回候选/`。
3. 补齐来源并审核；发布时把状态改为 `active`，移入根目录对应保留区，同时更新 `index.md` 与只追加的 `log.md`。

## LLMWiki 根目录

- [[raw/README-raw只读说明|raw]]：原始来源，只读。
- [[concepts/README-concepts怎么用|concepts]]：定义、原理、术语。
- [[entities/README-entities怎么用|entities]]：人物、软件、作品、项目等具体对象。
- [[comparisons/README-comparisons怎么用|comparisons]]：对比、冲突与取舍分析。
- [[queries/README-queries怎么用|queries]]：查询过程、证据和待复核结论。

目录兼容细节见 [[40-Wiki知识库/LLMWiki目录兼容说明]]，冲突与写回见 [[40-Wiki知识库/冲突与写回规则]]。

## 完成标准

- [ ] 正式条目位于正确的根目录保留区。
- [ ] 每个事实可追溯到来源或明确标记为本人判断。
- [ ] 冲突没有被静默覆盖。
- [ ] 正式变更按仓库规则维护了 `index` 与 `log`。

## 常见错误

- 把正式概念页放进 `40-Wiki知识库/`。
- 让 LLMWiki 的派生索引反向覆盖人类知识源。
- 修改 `raw/` 来“修正”来源。
- 把查询答案直接升级成确定事实。
