---
type: inbox
status: draft
created: "2026-08-14"
tags: ["comfyui", "wsl", "网关", "批量跑图", "bg_run", "工作流"]
source: "CardMaker 制卡「天际·龙裔之路」跑图过程"
---

# ComfyUI 从 WSL 网关直连 + 批量跑图脚本模式

## 这是什么

ComfyUI 跑在 Windows 侧（端口 8188），agent 在 WSL 里通过**网关 IP** 直连 API、批量队列、轮询结果、回拷产物的完整套路。

## 为什么值得留下

- 网关 IP 不是 127.0.0.1，每次都要 `ip route` 现算；写死会翻车。
- 批量跑图是长任务，用 `bg_run` 后台跑 + 完成通知自动唤醒，避免轮询烧上下文。
- 回拷、manifest 记录、旧版保留这些细节踩过一遍。

## 原始信息与自己的判断

**原始信息：**

- 探活/读结果：`curl -s -o /tmp/x.json "http://$GW:8188/system_stats"`（context-mode 会拦 inline curl，用 `-o` 落文件再读）。
- 网关：`GW=$(ip route | awk '/default/ {print $3}')`，ComfyUI 端口 8188。
- 队列：`POST /prompt` body `{"prompt": <api prompt dict>}` → 返回 `prompt_id`。
- 轮询：`GET /history/{prompt_id}`，`status.status_str` ∈ error/completed；图片在 `outputs[<SaveImage节点>].images`，视频在 `outputs[<SaveVideo节点>].images`（见另一笔记）。
- 回拷：产物落在 `C:\Users\lianj\SoftWare\Comfyui\ComfyUI\output\`，WSL 里即 `/mnt/c/Users/lianj/SoftWare/Comfyui/ComfyUI/output/`，用 `shutil.copy2` 拷进角色卡 `部件/assets/`。
- 长任务：`bg_run`（isAgent=false），脚本里 print 进度，完成通知自动唤醒续跑。
- 工作流库路径：`/mnt/c/Users/lianj/SoftWare/Comfyui/工作流库/`（生图-SDXL / 生图-Krea2 / 生图-Anima / 视频-Wan22-I2V），用户硬链接到 `user/default/workflows/`。

**我的判断：**

- 批量脚本固定模式：`jobs = [{key,prefix,pos,w,h,dir,seed}]` → 逐个 POST → 轮询 history → copy2 + 写 manifest.json。manifest 用「图片 keys + videos 段」结构，重跑某族时别覆盖 videos。
- 后台任务被杀时，ComfyUI 已出的图仍在 output 目录——补拷 + 重建 manifest 即可，不必重跑（这次就这么救回来的）。

## 下一步

- [x] 暂时保留（脚本已留档在「天际·龙裔之路」部件/assets/gen_*.py）
- [ ] 整理为工具卡：把「队列→轮询→回拷→manifest」抽成一个通用跑图 harness
