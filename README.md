# 知脉 · 技术知识与专利情报系统

第一阶段包含前端 Mock，以及 FastAPI、PostgreSQL、SQLAlchemy、Alembic、Docker Compose 和基础专利事实模型。

## 后端启动

```bash
cp .env.example .env
docker compose up --build
```

Windows PowerShell 可执行：

```powershell
Copy-Item .env.example .env
docker compose up --build
```

API 容器启动时会自动执行 Alembic 迁移。访问 `http://localhost:8000/api/health`。

数据库表位于 PostgreSQL 的 `patent` schema，当前包含：

- `patent.family`
- `patent.application`
- `patent.publication`
- `patent.claim`
- `patent.source_record`

## 前端启动

```bash
cd frontend
npm install
npm run dev
```

打开终端输出的本地地址（默认 `http://localhost:5173/login`）。Mock 登录默认填充 `admin / 1234`，也可使用任意非空用户名和至少 4 位密码。

页面入口：

- `/login` 登录
- `/dashboard` 工作台
- `/search` 全局检索（支持 `?q=`）
- `/patents` 专利库
- `/patents/:id` 专利详情

所有导航入口均保留，尚未进入本阶段的模块会显示 Mock 占位页。核心页面可用 `?state=loading`、`?state=empty`、`?state=error`、`?state=forbidden` 演示状态。

## 测试

后端本地测试：

```powershell
python -m pip install -r backend/requirements-dev.txt
python -m pytest
```

前端检查：

```bash
cd frontend
npm run build
npm test
```

前端只通过 `src/api/client.ts` 访问 Mock；真实后端接入时替换该客户端实现即可。
