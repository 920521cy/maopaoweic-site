# Cloudflare D1 Setup

本文件记录 v0.3.1 阶段的 D1 人工配置步骤。当前项目只做 D1 连接检测，不做真实商品入库、支付、注册登录或卡密发放。

## 1. 创建 D1 数据库

在 Cloudflare 控制台创建一个新的 D1 数据库，用于后续保存商品、订单、卡密库存和后台操作日志。

## 2. 添加 Pages Binding

进入 Cloudflare Pages 项目：

1. 打开 `Settings`。
2. 找到 `Bindings`。
3. 添加 D1 database binding。
4. Binding name 必须填写：`DB`。
5. 选择刚创建的 D1 数据库。

`functions/api/db-health.js` 会读取 `context.env.DB`，所以 binding 名称必须保持一致。

## 3. 应用初始迁移

将项目中的 SQL 文件应用到 D1：

```text
migrations/0001_initial.sql
```

该迁移会创建以下表：

- `products`
- `orders`
- `card_keys`
- `admin_logs`

迁移文件不包含真实数据，也不包含密钥。

## 4. 部署后检查

部署完成并绑定 D1 后，访问：

```text
https://maopaoweic.top/api/db-health
```

预期返回：

```json
{
  "ok": true,
  "service": "maopaoweic-site-db",
  "version": "v0.3.1",
  "message": "D1 is connected"
}
```

如果尚未绑定 D1，接口会返回 `503` 和 `D1 binding DB is not configured`。

## 5. 配置后台管理密钥

v0.6.0 开始，所有 `/api/admin/*` 后台接口都需要请求头 `x-admin-key`。服务端会读取 Cloudflare Pages 环境变量 `ADMIN_API_KEY` 进行校验。

在 Cloudflare Pages 项目中配置：

1. 打开 `Settings`。
2. 进入 `Environment variables`。
3. 新增变量：

```text
ADMIN_API_KEY=change-me-in-cloudflare
```

这里的值只是示例，不要提交或公开真实后台口令。配置完成后需要重新部署 Pages，新的环境变量才会在 Functions 中生效。
