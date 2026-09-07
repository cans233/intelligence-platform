# 知脉 · 技术知识与专利情报系统

第一阶段前端 Mock：React + TypeScript + Ant Design。

## 启动

```bash
npm install
npm run dev
```

打开终端输出的本地地址（默认 `http://localhost:5173/login`）。Mock 登录默认填充 `admin / 1234`，也可使用任意非空用户名和至少 4 位密码。

## 页面

- `/login` 登录
- `/dashboard` 工作台
- `/search` 全局检索（支持 `?q=`）
- `/patents` 专利库
- `/patents/:id` 专利详情

所有导航入口均保留，尚未进入本阶段的模块会显示 Mock 占位页。核心页面可用 `?state=loading`、`?state=empty`、`?state=error`、`?state=forbidden` 演示状态。

## 检查

```bash
npm run build
npm test
```

前端只通过 `src/api/client.ts` 访问 Mock；真实后端接入时替换该客户端实现即可。
