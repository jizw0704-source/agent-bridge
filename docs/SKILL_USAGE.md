# Agent Bridge Skill：安装与使用

[简体中文](SKILL_USAGE.md) | [English](en/SKILL_USAGE.md)

`agent-bridge` Skill 把 AB 接入、配对、交接、回复查看和故障处理变成可重复的操作流程。它指导当前 Codex；后台收件仍由已运行的 AB 连接器完成。安装 Skill 不等于连接器启动、双方配对或消息送达。

## 使用方式

可以对 Codex 说：

- `$agent-bridge 检查我的 AB 是否在线，当前卡在哪一步。`
- `$agent-bridge Wright 准备好了，帮我刷新接入邀请。`
- `$agent-bridge 帮我整理这条模拟交接，先不要发送。`
- `$agent-bridge 查看对方对上一条交接的回复。`

技能先检查当前状态，再按用户授权操作；不会因为调用技能就自动发送消息或确认对端身份。当前仍限于 `demo-export` 虚构任务，真实项目改动、PR 审批和 Windows 实际验收尚不属于已完成能力。

## Mac

本机已安装至 `~/.codex/skills/agent-bridge/`，绑定文件为 `~/.local/share/agent-bridge/skill-binding.json`。绑定仅保存已安装 AB 应用和私有 peer 目录的路径，不含令牌。源码保存在仓库 `skills/agent-bridge/`，更新源码后需另行更新安装副本；后台运行快照不自动随之升级。

只读检查：

```sh
node ~/.codex/skills/agent-bridge/scripts/ab-status.mjs
```

若自定义了 `CODEX_HOME`，实际安装位置以该目录下的 `skills` 为准。Codex 通常自动发现新技能；没有显示时可重启 Codex。当前对话也可直接要求读取该 `SKILL.md`。

## Wright 的 Windows

推荐直接从 [GitHub 技能目录](https://github.com/jizw0704-source/agent-bridge/tree/main/skills/agent-bridge)安装，不再需要单独接收技能 ZIP。

将 [Windows 接入说明](WINDOWS_ONBOARDING.md)开头的执行指令交给 Wright 的 Codex。它先获取源码并记录提交，再通过本机 Skill 安装器从同一 GitHub 提交安装 `skills/agent-bridge`；没有安装器／Python 时，从源码复制技能作为替代。接着检查环境、创建仅含路径的绑定并报告准备结果，等待新邀请和双方身份核对。

Skill 和 AB 运行程序需要分别准备；不得覆盖已有同名技能、绑定或 peer 状态。完整 PowerShell 命令、安装路径及缺失环境处理见接入说明。已有技能 ZIP 仍可离线安装，但必须核对版本。

## 验证与边界

本地 19 项测试通过；新测试验证缺少配置、离线检查、未配对状态以及错误输出不会泄露令牌或正文。Skill 结构通过官方创建器校验，Mac 安装副本已执行真实只读状态检查。服务器此前通过 16 项运行测试；没有为安装 Skill 重启或修改服务器。

Skill 不包含任何真实地址、用户名、身份代码、邀请、令牌、私钥或登录文件。更新和安装路径绑定与通信凭证分开保存。自动触发保持默认开启；是否能正确判断某个新场景，仍需按实际结果验收。尚未进行 Windows 原生或独立模型行为评测。

[官方技能发现说明](https://learn.chatgpt.com/docs/build-skills#install-curated-skills-for-local-use)。
