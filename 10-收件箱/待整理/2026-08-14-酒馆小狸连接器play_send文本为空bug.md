---
type: inbox
status: draft
created: "2026-08-14"
tags: ["tavern-tanuki", "酒馆小狸", "connector", "bug", "play_send", "createChatMessages"]
source: "CardMaker 制卡「天际·龙裔之路」运行时调试；~/tavern-tanuki/"
---

# 酒馆小狸连接器 play_send 用户消息文本为空的 bug

## 这是什么

`play_send` 发消息时，用户消息楼层被创建但文本为空。根因是连接器 `send` 处理器把消息字段名写错成 `content`，而 JS-Slash-Runner 的 `createChatMessages` 要的是 `message`。

## 为什么值得留下

- 症状诡异（消息存在但空、AI 因收到空输入而跑偏成第三人称/「好的，我将进行创作」式开场），不查源码很难定位。
- 修复/部署路径有坑：本地改了没用，浏览器跑的是远程 jsDelivr 版本；且本机对作者仓无写权限推不上去。

## 原始信息与自己的判断

**原始信息：**

- Bug 位置：`~/tavern-tanuki/dist/connector.js` 的 `async send()`，`createChatMessages([{ role: 'user', content: text }])`。正确字段是 `message`（见 `~/SillyTavern/public/scripts/extensions/third-party/JS-Slash-Runner/@types/function/chat_message.d.ts` 的 `ChatMessageCreating`）。
- 加载链路：酒馆侧「酒馆小狸连接器」脚本是**动态 loader**，从 Supabase 读版本指针 `sb_config.tanuki_script_ref`，再从 jsDelivr 拉 `dist/connector.js` 后 `eval`。所以本地改 dist/ 不影响浏览器。
- 部署障碍：`origin = fannnnnnn5822/tavern-tanuki`（作者仓），本机 `Github_Token` 属 `lide4144`，push 403；`~/.env.supabase` 缺 service key，`发版.mjs` 无法自动切指针。
- 绕过方案：把修好的 `dist/connector.js` 整体固化成独立脚本（不依赖 loader），让用户在酒馆助手导入并禁用旧 loader。已生成 `~/tavern-tanuki/tavern-script/酒馆小狸连接器-本地固定版.json`。

**我的判断：**

- 诊断技巧：`play_recent_messages` 里用户消息无文本 → 别急着怀疑 MCP/编码，先看连接器 `send` 里 `createChatMessages` 传的字段名；`get_chat` 读文件可确认消息楼层是否真的空。
- 「本地固定版」是权宜，失去自动更新；上游修复后应换回 loader。更彻底的做法是 fork 作者仓 + 重指 loader 的 Supabase/URL，待核对可行性。

## 下一步

- [x] 暂时保留（本地固定版脚本已生成）
- [ ] 整理为实体卡：tavern-tanuki（酒馆小狸）——部署链路、发版流程、已知坑
- [ ] 待核对：fork 作者仓 + 改 loader 指向是否可行，作为长期修复
