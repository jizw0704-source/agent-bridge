# 公司内网服务器部署（v0.3.0 试验版）

[简体中文](SERVER_DEPLOYMENT.md) | [English](en/SERVER_DEPLOYMENT.md)

2026-10-21：新增独立 `agent-bridge-observer.service`，通过 HTTPS 提供[交流观察室](OBSERVER.md)。复用现有独立 Node.js 22.23.3 和 TLS 证书，只读中继状态；中继原进程未重启。服务器完整 24 项自动测试通过，线上已核对健康接口、未登录拒绝、独立密钥登录及读取已有记录。真实交流、地址和密钥仍只保留于私有运行目录。以下为原中继部署的历史记录。

更新：2026-10-20。HTTPS 中转已部署到 Debian 12 公司内网服务器，并从另一台 Mac 完成实际网络收发验证。双方个人 Agent 仍在各自电脑运行；服务器只承担中转和状态保存，不需要安装 Codex 或存放双方的 Codex 登录凭证。

## 部署与验证

- 使用独立 Node.js 22.23.3，下载自 Node.js 官方源并核对 SHA-256；服务器原有 Node.js 18 保持不变。
- 代码版本为本地 v0.3.0 工作树快照，上传包与文件清单有校验值；不是已推送的新 Git 提交。
- Mac 和 Debian 均通过语法检查与全部 14 项自动化测试；无单独编译、格式化、lint 或类型检查流程。
- Mac 通过真实局域网访问服务器，模拟两个角色完成两轮请求与回复；测试包含重复回复去重、服务重启后配对及消息保留、错误凭证拒绝、错误证书指纹拒绝和关闭测试房间。
- 本次服务器验收没有调用模型，没有联系 Wright，没有读取或修改真实业务项目。真实 Codex 本机四轮验证属于此前的独立证据；真实 Windows 接入仍待验证。

## 服务布局

运行目录位于部署用户的 `~/.local/share/agent-bridge-server/`：

| 路径 | 用途 |
| --- | --- |
| `runtime/` | AB 独立 Node 运行时 |
| `releases/0.3.0-20261020/` | 已部署源码快照 |
| `current` | 指向当前源码快照的符号链接 |
| `state/` | 私有令牌、消息状态、TLS 证书和私钥 |
| `relay-server.mjs` | 绑定指定内网 IPv4 地址、8790 端口的启动入口 |
| `source-manifest.json` | 源码文件 SHA-256 清单 |
| `deployment-result.json` | 脱敏测试结果，不含登录或配对凭证 |

用户级服务名为 `agent-bridge-relay.service`，已启用；该账号原先已开启 systemd linger。服务因此不依赖 SSH 窗口保持打开。只绑定指定内网地址，不使用所有网卡监听，也没有配置公网转发。服务器没有重启，开机启动配置已检查，实际整机重启仍未验收。

## 运维

在部署账号的服务器终端中运行：

```sh
systemctl --user status agent-bridge-relay.service
journalctl --user -u agent-bridge-relay.service -n 50 --no-pager
systemctl --user restart agent-bridge-relay.service
systemctl --user stop agent-bridge-relay.service
systemctl --user start agent-bridge-relay.service
```

正常重启已通过验收。当前 `Restart=no`：异常崩溃不自动重试，避免在不确定的状态下抢占进程锁。若发现残留 `state/relay.lock`，须先确认记录的进程已退出、没有其他中转实例，再处理该锁并启动。不要盲目删锁。关闭开机启动可使用 `systemctl --user disable --now agent-bridge-relay.service`；停用不删除消息状态。

本次试验证书有效至 **2026-10-27 10:44 UTC（北京时间 18:44）**。到期前需安排证书更新和双方指纹更新；当前没有自动续期。不要关闭证书校验来绕过到期或指纹不匹配。房间有效期一天，邀请有效期十分钟；尚未生成真实 Wright 邀请。

## 接下来

待 Wright 在线时，通过服务器上的管理凭证创建新的限时邀请，为 Mac 配置所有者连接器，并私下交付一次性邀请。双方核对身份代码后，按[局域网接入说明](LAN_PILOT.md)运行各自连接器，验收真正的 Mac／Windows 双向 Codex 回复。

真实内网地址、登录信息和运行凭证不放入公开文档。证书指纹和实际地址保存在本机私人部署记录中；服务能够读取中转消息，尚非端到端加密。整个试验仍限于 `demo-export` 虚构任务。
