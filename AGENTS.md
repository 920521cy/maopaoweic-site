# 项目规则

## 项目目录

当前有效目录：

D:\projects\maopaoweic-site

旧目录：

D:\Dmaopaoweic-site

旧目录已废弃，不要使用。

---

## 项目类型

纯静态网站：

- HTML
- CSS
- JavaScript

不要引入：

- React
- Vue
- Next.js
- Node 大型框架
- npm 构建系统

保持轻量化。

---

## 部署链路

本地 Git
→ GitHub
→ Cloudflare Pages
→ maopaoweic.top

GitHub 仓库：

920521cy/maopaoweic-site

---

## Git 规则

修改前先执行：

git status

提交后执行：

git push

不要使用：

git push --force

commit message 使用中文。

---

## Cloudflare Pages

push 到 main 后：

Cloudflare Pages 会自动部署。

修改完成后：

检查：

- Pages 是否部署成功
- maopaoweic.top 是否正常打开
- 样式是否丢失
- 静态资源路径是否正确

---

## 文件规则

主要文件：

- index.html
- style.css
- script.js

不要随意删除：

- .git
- .gitignore
- README.md

不要修改：

- Git 历史
- remote 配置

---

## UI 风格

目标风格：

- 极简
- 深色
- AI 实验室风格
- 科技感
- 响应式布局
- 适配手机

避免：

- 花哨动画
- 复杂框架
- 过度设计

---

## 工作原则

先分析再修改。

大改动前：

先说明计划。

修改后：

说明：

1. 修改了什么
2. 为什么这样改
3. 是否影响部署
4. 是否需要 git push

默认不要自动删除文件。
默认不要创建大型依赖。