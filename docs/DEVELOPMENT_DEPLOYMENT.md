# 开发任务版本：服务器与 Mac 部署

[简体中文](DEVELOPMENT_DEPLOYMENT.md) | [English](en/DEVELOPMENT_DEPLOYMENT.md)

2026-10-23 部署完成。运行代码固定在 `d9d18eefa865c0cdd132dbcedb194d57f5c7c205`；本记录及后续文档提交不表示运行代码再次升级。

## 已完成

- 公司 HTTPS 中转切换到独立版本快照，保留原状态、证书和联系人，旧快照及停止时状态已有私有备份。服务器部署前 54/54 测试通过。
- Mac 普通收件器切换到同一版本；仓库内 Skill 已同步安装，文件内容与运行快照一致。旧 Skill、启动配置和联系人状态已备份。Mac 部署后 54/54 测试通过。
- Mac 新增独立开发收件器，绑定已有 Wright 联系人。执行 policy 为空，不允许对端在 Mac 自动改代码；只准备接收任务报告。
- 正式联系人 ready=true，原 20 条消息保留，A 仍 archived、B 仍 active，无重新配对。
- 实际中转上用单独合成联系人验证 development-v1 任务／请求／回复／接收，以及按 scope 分开的收件箱；合成任务归档、联系人关闭。没有把该检查算作真实 Windows 开发验收。
- 观察室健康接口返回 200，匿名快照访问返回 401；本次没有重启、升级或修改观察室，独立并行 UI 改动未部署。

## 首个任务准备

专用公开测试仓库：[ab-development-sandbox](https://github.com/jizw0704-source/ab-development-sandbox)，仅含平台标签示例及说明，不包含业务或个人资料。

- 任务 ID：`dev-windows-label-001`，development-v1。
- 仓库标识：`jizw0704-source/ab-development-sandbox`。
- 起始提交：`e4abd7a85855dc11b64e1b023d5517cdea9226d5`，Mac 本地与 GitHub main 一致。
- 仅修改 `platform-label.mjs`：增加 win32→Windows，保留 darwin→Mac、其他→Other。
- 首次只允许编辑、语法／文本检查和本地提交；automatic=false、push=false、draft_pr=false。不操作业务项目。
- 交接 JSON 已在 Mac 私有目录准备，但**尚未发送**。等待 Wright 自己确认仓库、联系人授权及新收件器准备完成后，再经 AB 投递。

Wright 应按[升级与本机授权说明](WRIGHT_DEVELOPMENT_ONBOARDING.md)获取固定提交。必须由 Wright 本人在其电脑确认最小授权；Bertil 的部署和长期联系人均不能代替这一步。收到待授权任务后，由 Wright 本机批准，再验证实际改动、独立分支、检查与结果回报。

## 证据与边界

服务器和 Mac 的私有部署目录保留测试输出、部署摘要、备份及手动回退依据，公开仓库不保存 config、令牌、完整日志或私有主机地址。回退只切换代码和本机启动配置，不用旧状态覆盖新收到的消息。

本次已部署并验证基础通信；真实 Windows 开发执行、开发任务的跨电脑澄清／取消／去重／隔离、自动授权模式和实际 GitHub 推送／草稿 PR 仍待验收。语法／文本断言不能替代功能测试。TLS 证书沿用原证书，本次没有实现自动续期。
