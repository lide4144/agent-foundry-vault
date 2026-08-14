# Agent Foundry Vault智能体工坊操作日志

本文件只追加。不要记录秘密、令牌、完整私密对话或环境变量值。

## 2026-07-17 | release | v0.1.0

- 首次公开发布 Agent Foundry Vault智能体工坊，采用 MIT License。
- 验证：`node scripts/verify-repo.mjs` PASS（131 文件、110 Markdown、7 JSON、3 条 JSONL、96 个链接）；`node scripts/harness-smoke.mjs` PASS（3/3）。
- 边界：离线检查与 Mock 已通过；真实 Hermes、SillyTavern 和外部同步仍需由部署者在各自环境中验证。

## 2026-08-11 | tooling | Vault Git 同步脚本

- 新增 `scripts/sync-vault.mjs`：校验通过后暂存、按需提交、rebase 拉取并推送。
- 新增无网络的临时 Git 仓库集成检查，并把它加入 `npm run check`。
- 验证：`npm run check` PASS；实际远端推送见同次提交。
