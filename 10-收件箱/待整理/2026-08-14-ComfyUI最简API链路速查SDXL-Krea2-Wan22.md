---
type: inbox
status: draft
created: "2026-08-14"
tags: ["comfyui", "api", "sdxl", "krea2", "wan2.2", "i2v", "跑图", "提示词"]
source: "CardMaker 制卡「天际·龙裔之路」跑图过程；工作流源码 ~/tripose-kit/工作流库/"
---

# ComfyUI 最简 API prompt 链路速查（SDXL / Krea2 / Wan2.2）

## 这是什么

绕过 UI 工作流，直接 POST `/prompt` 跑图/跑视频的三条**最简节点链**（已验证）。适合 agent 批量跑图时手写 API prompt，不必依赖前端 `graphToPrompt`。

## 为什么值得留下

- UI 工作流 JSON 转 API prompt 很繁琐（links 映射、TriPoseZhTagMap、FaceDetailer、精炼段），但**最简链跳过这些也能出图**，冒烟/批量足够。
- Krea2 和 Wan 的采样参数不是默认值，凭记忆容易写错；这里留了可复制的参数集。

## 原始信息与自己的判断

**原始信息（已验证，ComfyUI 8188 / AMD 8060S）：**

- **SDXL 最简**（6 节点）：`CheckpointLoaderSimple`(SDXL\oneObsession_v23) → `CLIPTextEncode`×2 → `EmptyLatentImage` → `KSampler`(steps=20, cfg=6.0, dpmpp_2m/karras) → `VAEDecode` → `SaveImage`。
- **Krea2 最简**（写实）：`UNETLoader`(Krea2\moodyKrea2Mix_v70) → `CLIPLoader`(Krea2\qwen3vl_4b_fp8_scaled, type=krea2) → `VAELoader`(Anima\qwen_image_vae) → `ModelSamplingAuraFlow`(shift=1.15) → `CFGNorm`(strength=1, pre_cfg=false) → `CLIPTextEncode`×2 → `EmptyLatentImage` → `KSampler`(steps=8, cfg=1.0, er_sde/simple) → `VAEDecode` → `SaveImage`。Power Lora 那两个默认 LoRA（Niji/Cornflower）本地没有，可空。
- **Wan2.2 I2V 最简**：Hi/Lo 两段采样——`UNETLoader` Hi + Lo 各一路，各自过 `ModelSamplingSD3`(shift=5)；`CLIPLoader`(umt5_xxl_fp8, type=wan) → `CLIPTextEncode`×2（自然语言）；`VAELoader`(wan_2.1_vae)；`LoadImage` 起始帧 → `WanImageToVideo`(width,height,length=49,batch=1)；**两段 KSamplerAdvanced**：Hi 走 start=0/end=2 + return_with_leftover_noise=enable，Lo 走 start=2/end=4（latent 接 Hi 输出）；`VAEDecode` → `CreateVideo`(fps=16,bit_depth=8) → `SaveVideo`。
- **SaveVideo 输出键坑**：mp4 挂在 `outputs[<SaveVideo节点>].images`，不是 `.videos` 或 `.gifs`。批跑脚本轮询时三个键都要查。

**我的判断：**

- Krea2 的 CLIP 是 qwen3vl（视觉语言模型），**吃自然语言描述，不吃 danbooru tag**；负向也是自然语言（加 cartoon/anime 可压掉二次元味）。
- Wan 起始帧会被 WanImageToVideo 内部 resize 到 width×height，aspect 不匹配只是轻微拉伸，冒烟可接受。
- 这三条链可以直接固化成一个 `build_xxx(seed, prompt, w, h, prefix)` 函数复用。

## 下一步

- [x] 暂时保留（跑图脚本 gen_sdxl.py / gen_krea2.py / gen_wan.py 已在「天际·龙裔之路」部件/assets 里留档）
- [ ] 整理为工具卡：补全参数表 + 各模型族可复制的 node dict
- [ ] 整理为实体卡：TriPose 套件（~/tripose-kit）
