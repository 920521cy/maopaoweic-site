# Admin Access Setup

本文档记录 v0.6.1 阶段的后台访问保护说明。当前后台保护只是临时的后台 API 访问口令，不是正式用户登录系统。

## 1. Cloudflare Pages 环境变量

后台接口 `/api/admin/*` 会读取 Cloudflare Pages Production 环境变量：

```text
ADMIN_API_KEY=change-me-in-cloudflare
```

上面的值只是示例。真实口令只应配置在 Cloudflare Pages 的环境变量中，不要提交到 Git，不要写入前端代码，也不要写入文档。

配置路径：

```text
Cloudflare Pages 项目 -> Settings -> Environment variables
```

如果 Cloudflare 提供 secret/encrypted 类型，应优先使用 secret/encrypted。配置或更新后需要重新部署 Production。

## 2. 浏览器会话保存

后台页面输入的管理员口令只保存在当前浏览器会话的 `sessionStorage` 中。

- 关闭浏览器会话后需要重新输入。
- 不会写入 `localStorage`。
- 页面不会显示口令明文。
- 不要把 `ADMIN_API_KEY` 发给别人。

## 3. 当前边界

当前只是后台 API 的基础访问保护，用于降低演示后台被直接访问的风险。

它不是正式用户注册登录系统，不包含账号体系、权限分级、审计登录、找回密码或多因素认证。后续如果需要正式后台账号，应另行设计完整认证与授权方案。

## 4. 安全限制

当前阶段仍然保持：

- 不接真实支付。
- 不发放真实卡密。
- 不显示真实卡密。
- 只展示脱敏卡密字段。
- 不在前端硬编码管理员口令。
