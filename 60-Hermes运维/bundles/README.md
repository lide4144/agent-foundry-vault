# Skill Bundles

示例 Bundle 使用短名 `agent-foundry`，组合 `agent-foundry-vault`、`obsidian` 与 `llm-wiki`；它刻意不与同名 Skill 重名，避免调用遮蔽。

## 何时用

每次 Agent Foundry Vault 任务都需要固定组合的多个 Skill 时。

## 三步操作

1. 确认 bundle 中列出的 Skill 已能被真实 Hermes 发现。
2. 人工复制示例到实际 Hermes skill-bundles 目录并重载。
3. 从 Agent Foundry Vault智能体工坊根目录启动 Hermes，查看 bundle 内容并做一次低风险真实调用；bundle 不能替代正确工作目录和 `AGENTS.md` 加载验证。

## 完成标准

- [ ] bundle 名称没有遮蔽不该遮蔽的同名 Skill。
- [ ] 缺失 Skill 已处理。
- [ ] 调用结果有运行记录。

## 常见错误

- 以为 bundle 会自动安装 Skill；它只组合已存在的 Skill。
- 文件留在 Vault 就声称 bundle 已加载。
- instruction 试图绕过 AGENTS.md 或审批。
