# Agent Foundry Vault Wiki Schema

## Domain

本 Vault 覆盖 Agent Harness、工具与 SOP、来源可追溯知识、创意项目和 Hermes 运维。它既是人类通过 Obsidian 阅读的工作台，也是 Hermes `llm-wiki` 可维护的 Markdown Wiki。

## 顶层结构

| 路径 | 用途 |
|---|---|
| `00-开始这里/` | 新手导航与课程 |
| `10-收件箱/` | 未分类记录与写回候选 |
| `20-Agent-Harness/` | 协议、角色、任务、trace、评测 |
| `30-系统工具库/` | 方法、规范、SOP、模板说明、诊断 |
| `40-Wiki知识库/` | Wiki 的人类使用说明与入口 |
| `raw/` | LLMWiki 原始来源快照，只读 |
| `concepts/` | 概念、原理、术语 |
| `entities/` | 人、组织、产品、项目、模型等实体 |
| `comparisons/` | 多对象对比与冲突分析 |
| `queries/` | 值得长期保存的综合查询 |
| `50-创意库/` | 灵感、世界观、角色、调试与发布 |
| `60-Hermes运维/` | 运行、Skill、事件、指标、变更与复盘 |
| `70-协同桥接/` | Obsidian、LLMWiki、Hermes 接口与同步 |
| `80-看板与索引/` | 手工看板和可选查询 |
| `90-归档/` | 已替代或停止使用的内容 |

`raw/`、`concepts/`、`entities/`、`comparisons/`、`queries/` 保持在 Vault 根目录，以便 Hermes 的 LLMWiki Skill 与 Obsidian 指向同一根路径。

## Frontmatter 分级

### 第一周：捕捉笔记

只需五类字段；没有来源时可以暂不填 `source`：

```yaml
---
type: inbox
status: draft
created: 2026-07-17
tags:
  - inbox
source:
---
```

### 正式页面

发布到三库或 LLMWiki 时，再补长期治理字段：

```yaml
---
title: 示例概念
created: 2026-07-17
updated: 2026-07-17
type: concept
status: active
tags:
  - wiki
knowledge_class: factual
sources:
  - raw/articles/example.md
---
```

`knowledge_class` 只允许：

- `factual`：可验证事实；
- `procedural`：方法、规范、SOP；
- `fictional`：虚构设定与创作；
- `operational`：运行、事件、指标与决策。

事实页面必须有 `sources`；虚构页面不得借用事实来源制造“已验证”的外观。

## Tag Taxonomy

正式 LLMWiki 页的每个 tag 必须先出现在这里；需要新 tag 时，先审核并更新本节，再使用。tag 统一小写英文，状态不做 tag。

<!-- llmwiki-tag-taxonomy:start -->
- `wiki`
- `concept`
- `entity`
- `comparison`
- `query`
- `summary`
- `raw`
- `agent-harness`
- `obsidian`
- `hermes`
- `sillytavern`
- `tooling`
- `governance`
- `safety`
- `operations`
- `creative`
- `research`
<!-- llmwiki-tag-taxonomy:end -->

## 状态

只使用：`draft`、`candidate`、`active`、`deprecated`、`archived`。状态只放属性，不再复制成一整套状态标签。

## 文件命名

- 标题先服务人类可读，再服务机器稳定。
- 中文主题可使用简短中文文件名；技术 slug、Skill 与机器数据使用小写连字符。
- 日期固定 `YYYY-MM-DD`；版本固定 `v主.次.补丁`。
- 禁止 Windows 保留名、首尾空格、同目录同名和含义不明的 `最终版-真的最终版`。
- 改名或移动前先扫描引用；不做“顺手全库重命名”。
- 所有文本使用 UTF-8。

## Wiki 页面阈值

只有满足至少一项时才建正式 Wiki 页：

- 后续会被再次引用；
- 汇总了多个来源；
- 解决了一个明确冲突；
- 重建成本明显高于维护成本。

路过一次的名字不建实体页；暂时看不出归属的内容留在收件箱。

## 链接

- 使用 Obsidian `[[wikilink]]` 或标准 Markdown 相对链接，目标必须存在。
- 正式 Wiki 页至少链接到两个真正相关的页面；入口页、模板、日志、raw 和收件箱例外。
- 不为满足数量制造弱链接。
- basename 有歧义时写完整相对路径。

## 来源与冲突

- `raw/` 是不可改的来源快照；网页变化时保存带日期或哈希的新版本。
- 来源条目记录精确 URL/文件、摄入日期和正文哈希；秘密与受限材料不得摄入。
- 单一来源页可只在 `sources` 列表标注。
- 三个及以上来源的综合页，在关键段落使用普通脚注指向精确 raw 路径。
- 冲突页同时保留两个主张、各自来源、检索时间、置信度和采用理由。

## Index 与 Log

- 新正式页加入 `index.md` 对应区块，并写一句摘要。
- 每次摄入、发布、更新、归档和 lint 都追加到 `log.md`。
- `log.md` 超过约 500 条时轮转为 `log-YYYY.md`，根 `log.md` 继续记录当年新事件。

## 归档

归档保持原相对结构并移入 `90-归档/` 或 LLMWiki `_archive/` 兼容区；从索引移除，修正指向它的链接，并记录替代页面。归档不等于删除。
