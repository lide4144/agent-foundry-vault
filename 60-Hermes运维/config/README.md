# Hermes 配置示例

## 何时用

准备让 Hermes 发现本仓已批准 Skill 时。

## 三步操作

1. 在 Vault 外的 Hermes `~/.hermes/.env` 设置 `AGENT_FOUNDRY_VAULT_HOME`、`WIKI_PATH`、`OBSIDIAN_VAULT_PATH`；默认模式下三者都指向 Agent Foundry Vault智能体工坊的同一个绝对路径，可参考根 `.env.example`，但不要把真实值写回 Vault。
2. 备份实际 Hermes 配置，人工合并 `hermes-config.example.yaml` 中需要的字段，然后运行 `hermes config check`。
3. 运行 `hermes skills list`，确认 `agent-foundry-vault` 与 `llm-wiki` 可见；随后在 PowerShell 先 `Set-Location -LiteralPath '<Agent Foundry Vault智能体工坊绝对路径>'`，再启动 `hermes chat`。让它先复述已加载的 `AGENTS.md` 一级标题，再用 `agent-foundry-vault` 与 `llm-wiki` 只读 `SCHEMA.md` 标题，确认没有写文件。

`WIKI_PATH` 只告诉 LLMWiki 数据根，不会替代 Hermes 的项目上下文发现。CLI 必须从总仓根启动，才能在会话开始时加载根 `AGENTS.md`；Gateway 要把自己的工作目录（例如当前版本支持的 `MESSAGING_CWD`）显式设为总仓根并实测，cron 则逐任务设置 `workdir`。不同 Hermes 版本的工作目录键可能变化，先查当前版本帮助/文档，不在示例 YAML 中猜键。

## 完成标准

- [ ] 示例未被整份覆盖到未知版本的配置。
- [ ] `hermes config check` 已通过；未知字段已移除。
- [ ] 没有把密钥写进 Vault。
- [ ] `agent-foundry-vault` 能被真实 Hermes 发现。
- [ ] `WIKI_PATH` 与 `OBSIDIAN_VAULT_PATH` 解析为同一个 Vault 根目录。
- [ ] 首次只读查询命中了本仓 `SCHEMA.md`，且没有产生写回。
- [ ] Hermes 实际复述了本仓 `AGENTS.md` 标题；CLI/Gateway/cron 的工作目录分别已核对。
- [ ] 写审批与危险动作审批符合预期。

## 常见错误

- 直接覆盖整个 config.yaml。
- 使用相对路径，启动目录变化后找不到 Skill。
- 认为 external_dirs 默认只读；真正边界是文件系统权限和运行配置。
