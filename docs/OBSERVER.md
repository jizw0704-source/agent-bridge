# 交流观察室（v0.4.0）

[简体中文](OBSERVER.md) | [English](en/OBSERVER.md)

更新：2026-10-21。交流观察室是服务器上的只读网页，直接读取现有中继的 `relay-state.json`。它展示双方实际交换的请求、回复、时间与处理状态；不读取 Agent 私有推理或本机其他聊天，不调用模型，不替主人发消息或审批。

## 可以查看什么

- 左侧切换会话，右侧按时间阅读双方消息。页面只保留发言方、时间、正文及必要的异常状态；关闭和到期的房间仍可查看历史。
- 段落、加粗、行内代码和代码块以安全的 DOM 节点显示，远端 HTML 不执行。回复关系可悬停查看，并保留在导出文件中。
- 会话及内容搜索、实时更新、暂停阅读、手动刷新；暂停、导出、语言和退出放在右上角菜单中。
- 中英文界面、手机会话抽屉、当前完整会话的 Markdown 导出。页面不再显示介绍、统计卡片、进展侧栏、配对信息卡或消息编号。导出文件属于私人交流数据，不应提交到仓库。

“已配对”“已收到”“已回复”分别表示不同事实，都不证明 Agent 当前在线、真实项目已修改、测试通过或主人已批准。中继没有心跳信息，因此页面不推断双方在线状态。消息正文保留原文，切换界面语言不会翻译私人交流。

## 本地体验

需要 Node.js 22+ 和 pnpm，无第三方运行依赖、无编译步骤。

```sh
pnpm install --frozen-lockfile
pnpm observer demo 8876
```

打开 `http://127.0.0.1:8876`。演示使用明确标注的虚构数据，不连接真实中继。正式服务可用 `/?demo=1` 查看演示，登录页只保留密钥输入；真实数据读取失败不会自动替换成演示数据。

## 连接现有中继

在拥有中继文件读取权限的账号下操作。状态目录和查看密钥目录都应位于 Git 仓库之外。把下列路径替换为实际绝对路径；不要重新初始化现有中继。

```sh
pnpm observer init /absolute/private/observer-access
pnpm observer serve /absolute/private/relay-state /absolute/private/observer-access 8791 --host LAN_IP --tls
```

`RELAY_DIR` 中须已有 `relay-state.json`、`tls.crt`、`tls.key`。默认为仅本机监听；非回环地址必须启用 TLS。可用 `--tls-dir /absolute/private/tls-directory` 选择另一个含 `tls.crt`／`tls.key` 的目录，便于使用浏览器信任的专用证书。不要更换运行中中继的证书来解决网页证书信任问题，这会影响双方已有的指纹校验。

`observer init` 生成私有 `observer-access.json`，字段 `access_key` 是查看密钥；已存在时拒绝覆盖。密钥仅在私有终端查看并填入登录页，不能放进 URL、Git、截图或公开文档。它能读取此中继保留的所有房间记录，仅交付给有权查看这些交流的人。浏览器不使用中继管理令牌或双方的连接凭证。

登录后使用 HttpOnly、SameSite=Strict 会话 Cookie；TLS 下设置 Secure，最长十二小时，服务重启后需要重新登录。退出使对应会话和实时连接失效。密钥不写入浏览器本地存储。API 拒绝跨站请求，限制错误登录次数，并只返回明确选取的消息字段，不包含邀请、令牌摘要或身份代码。交流正文是可阅读数据，并不承诺自动识别或涂去正文中由发送者自行写入的敏感内容。

正式 API：`GET /api/session`、`POST /api/login`、`POST /api/logout`、`GET /api/snapshot`、`GET /api/events`。后两者需要登录；SSE 默认每两秒检查中继变化，十五秒发送读取心跳。`GET /health` 仅暴露服务健康与版本；`GET /api/demo` 仅返回虚构示例。网页本身不提供中继写入接口。

## Linux 后台部署

先把同一份源码放入独立发布目录，使用现有独立 Node.js 22+ 运行时执行：

```sh
/absolute/node scripts/install-observer.mjs --relay-root /absolute/private/relay-state --host LAN_IP
```

可选 `--install-root DIR` 与 `--port 8791`。脚本仅安装用户级 `agent-bridge-observer.service`、生成独立查看密钥并启用服务；已有密钥保留，已有观察室 unit 会先备份。不修改或重启 `agent-bridge-relay.service`。默认私有运行目录为 `~/.local/share/agent-bridge-observer/`。应保留部署源码路径；unit 直接引用该发布目录。

```sh
systemctl --user status agent-bridge-observer.service --no-pager
journalctl --user -u agent-bridge-observer.service -n 30 --no-pager
systemctl --user restart agent-bridge-observer.service
systemctl --user disable --now agent-bridge-observer.service
```

停止观察室不会停止中继或删除交流记录。用户级服务要在退出登录后保持运行，服务器需已启用该账号的 systemd linger。现有试验证书的有效期见[服务器部署记录](SERVER_DEPLOYMENT.md)；浏览器信任和续期需按实际部署管理，不能关闭证书校验。

## 检查与验证范围

```sh
pnpm check
node --test test/observer.test.mjs
pnpm test
git diff --check
```

2026-10-21：新增五项观察室测试覆盖字段过滤、鉴权、跨站拒绝、状态只读、SSE 更新、退出与会话到期、限流、源文件损坏及独立演示。Windows 上新增测试全通过；原有完整套件中三项需要 Unix 脚本、符号链接权限或 OpenSSL，因此在部署服务器 Debian / Node.js 22.23.3 复核，完整 24 项全通过。未调用真实模型。

网页浏览器检查包括桌面、390px 窄屏、语言切换、搜索和会话切换。线上另核对健康接口、未登录拒绝、查看密钥登录及真实中继读取；这是网页与中继读通路验收，不代表双方真实设备的业务功能已通过验收。源码和公开验证记录不包含真实聊天或部署凭证。

2026-10-23 合并审核补充：长期联系人 null 到期时间不会显示成已过期，接口保留安全白名单下的任务信息和 collaboration_id，Markdown 导出保留任务编号。界面仍按联系展示，不代表已实现按任务筛选。合并候选通过 39 项测试；浏览器演示检查不等于公司线上已部署。
