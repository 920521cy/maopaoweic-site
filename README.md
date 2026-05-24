# maopaoweic-site

冒泡维C的个人主页 + AI实验展示站。

域名：`maopaoweic.top`

## 项目结构

```text
maopaoweic-site/
├── index.html
├── style.css
├── script.js
├── README.md
└── .gitignore
```

## 本地预览

任选一种方式：

```bash
python -m http.server 5173
```

然后访问：

```text
http://localhost:5173
```

也可以直接双击 `index.html` 预览。

## 部署到 Cloudflare Pages

1. 将项目上传到 GitHub，新建仓库名建议使用 `maopaoweic-site`。
2. 登录 Cloudflare Dashboard，进入 `Workers & Pages`。
3. 点击 `Create application`，选择 `Pages`。
4. 连接 GitHub，并选择 `maopaoweic-site` 仓库。
5. 构建设置：
   - Framework preset：`None`
   - Build command：留空
   - Build output directory：`/`
6. 点击部署，等待 Cloudflare Pages 生成预览域名。

## 绑定域名 maopaoweic.top

1. 在 Cloudflare Pages 项目里进入 `Custom domains`。
2. 点击 `Set up a custom domain`。
3. 输入 `maopaoweic.top`。
4. 按 Cloudflare 提示添加或确认 DNS 记录。
5. 如果域名 DNS 已托管在 Cloudflare，通常会自动创建 CNAME/相关记录。
6. 等待证书签发和 DNS 生效，之后访问 `https://maopaoweic.top`。

## 后续可扩展

- 增加真实项目列表
- 添加邮箱、GitHub、社交链接
- 增加 AI 实验详情页
- 添加访问统计或表单服务
