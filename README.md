# 知脉 · 技术知识与专利情报系统

第一阶段前端 Mock 位于 `frontend/`：React + TypeScript + Ant Design。

## 启动

```bash
cd frontend
pnpm install
pnpm dev
```

打开终端输出的本地地址（默认 `http://localhost:5173/login`）。Mock 登录默认填充 `admin / 1234`，也可使用任意非空用户名和至少 4 位密码。

## 页面

- `/login` 登录
- `/dashboard` 工作台
- `/search` 全局检索（支持 `?q=`）
- `/patents` 专利库
- `/patents/:id` 专利详情
- `/projects` 项目库
- `/projects/:id` 项目详情
- `/knowledge` 知识库
- `/technologies` 技术库
- `/documents` 文档中心
- `/monitoring` 外部专利监控 Profile
- `/review` 审核中心
- `/data-center` 数据中心
- `/admin` 系统管理

全局检索中的保存项称为“内部检索”；外部专利监控 Profile 只位于 `/monitoring`。核心页面可用 `?state=loading`、`?state=empty`、`?state=error`、`?state=forbidden` 演示状态。

## 检查

```bash
cd frontend
pnpm build
pnpm test
```

页面通过 `src/api/` 下的 `patent.ts`、`project.ts`、`search.ts` 访问 Contract Mock。本阶段不连接真实后端或 OpenSearch。
