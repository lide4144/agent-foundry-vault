# 本仓脚本

全部脚本使用 Node.js 内置模块，不需要先安装依赖。

## 只读检查

```powershell
node scripts/verify-repo.mjs
```

检查目录、UTF-8、JSON/JSONL、内部链接、正式 Wiki 字段与明显凭证泄漏。它不会修改文件。

## Harness 冒烟测试

```powershell
node scripts/harness-smoke.mjs
```

用确定性的 Mock Adapter 回放种子任务，并按四份 Schema 检查 task、result、trace 和 evidence ledger。通过只说明协议、路由和结果结构接通，不代表真实模型质量。

## 展开第一条 Harness 案例

```powershell
node scripts/show-first-seed.mjs
```

它读取第一条种子案例并打印校验、路由、结果与精简 trace；全程只读，可作为接入真实 adapter 前的最小示例。

## 创建第一条收件箱笔记

先预览：

```powershell
node scripts/new-inbox-note.mjs "我想整理的主题"
```

确认路径和内容后再落盘：

```powershell
node scripts/new-inbox-note.mjs "我想整理的主题" --apply
```

写到闪念区：

```powershell
node scripts/new-inbox-note.mjs "一个角色火花" --kind=闪念 --apply
```

脚本只能写 `10-收件箱/待整理` 或 `10-收件箱/闪念`，遇到同名文件会停止，不会覆盖。

## 校验、提交并同步 Vault

```powershell
npm run sync -- "vault update: 简短说明"
```

脚本先运行仓库校验，再暂存全部改动；有改动时才提交，随后执行 `git pull --rebase` 和 `git push`。校验、提交、拉取或推送任一步失败都会停止。

同步脚本的本地集成检查：

```powershell
npm run test:sync
```
