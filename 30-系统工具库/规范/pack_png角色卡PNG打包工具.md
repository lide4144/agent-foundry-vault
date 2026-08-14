---
type: tool
status: active
created: 2026-08-14
tags:
  - sillytavern
  - 角色卡
  - 打包
  - 工具
source: 修女与女忍的双面日常 制卡（2026-08-14）；规范依据 STDB A2 §5（ST 源码 character-card-parser.js）
---

# pack_png.py — 角色卡 JSON 嵌入封面 PNG

角色卡 PNG = 封面图 + tEXt chunk。脚本位置：`~/CardMaker/tools/pack_png.py`（各卡文件夹内的同名文件是分发副本）。

## 何时用

- 角色卡要从 JSON 交付物升级为带封面的 PNG 卡（酒馆直接拖入即玩）。
- 需要回读校验一张 PNG 卡里嵌的卡数据。

## 用法

```bash
python3 pack_png.py 封面.png 角色卡.json 输出.png   # 打包并自动回读校验
python3 pack_png.py 某张卡.png                      # 只回读校验
```

## 机制（与 ST 的 write() 行为一致）

1. 清除 PNG 里旧的 `chara`/`ccv3` tEXt chunk。
2. IEND 前插入 `chara` chunk = base64(UTF-8 完整 V2 JSON)。
3. 同内容 spec 改为 `chara_card_v3`/`3.0` 再写一个 `ccv3` chunk（ST 读取时 ccv3 优先）。
4. 其他 chunk 原样保留；写完立即回读两个 chunk 解析校验。

## 常见错误

- 只写 `chara` 不写 `ccv3`：新版 ST 生成/部分工具读 ccv3 优先，双写最稳。
- 凭记忆写字节格式：规范以 STDB `A2_角色卡格式规范.md` §5 为准（来源 ST 源码，high）。
- 用网络 base64 工具在线转：卡 JSON 含 NSFW 内容与中文，本地脚本一次到位。

## 关联

- 组装管线：卡文件夹的 `build.mjs`（部件源码 → 卡 JSON）→ 本脚本（JSON + 封面 → PNG）。
- TavernWeave `sillytavern-card-pipeline` 只有 embed-png 能力契约、无实现，本脚本即该能力的本地实现。
