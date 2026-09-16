# 知脉 · 技术知识与专利情报系统

当前后端已完成 Phase 1 基础设施和 Phase 2 核心事实库、任务模型、RBAC 与业务 API。Phase 2 不接入真实外部专利源，不实现 OpenSearch、BM25 或 AI。

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

Phase 2 使用 `.env` 中的 `AUTH_SECRET` 签发开发环境 Bearer Token；生产环境必须替换为高强度密钥。

加载正式开发 Fixture：

```powershell
docker compose exec api python scripts/seed_fixtures.py
```

本地执行迁移 smoke test：

```powershell
$env:DATABASE_URL="postgresql+psycopg://app:app@localhost:5432/intelligence_platform"
.\.venv\Scripts\python.exe scripts/migration_smoke.py
```

数据库按 `patent`、`company`、`document`、`system` schema 分层。核心表包括：

- `patent.family`
- `patent.application`
- `patent.publication`
- `patent.claim`
- `patent.source_record`
- `patent.abstract`、`patent.description`
- `patent.applicant`、`patent.inventor`
- `patent.application_applicant`、`patent.application_inventor`
- `patent.classification`、`patent.priority`、`patent.citation`
- `patent.legal_event`、`patent.family_member`、`patent.field_provenance`
- `company.organization`、`company.department`、`company.project`、`company.technology`
- `company.project_technology`、`company.project_patent`、`company.technology_patent`、`company.project_document`
- `document.document`、`document.document_version`、`document.parsed_content`
- `system.user`、`system.role`、`system.permission`、`system.user_role`、`system.role_permission`
- `system.job`、`system.job_log`

正式 API 前缀为 `/api/v1`，包括登录、当前用户、专利事实、项目、技术、文档和任务查询接口。所有业务响应遵循：

```json
{"code": "OK", "data": {}, "message": "ok", "trace_id": "..."}
```

外部采集仅定义 `PatentSourceAdapter` 契约，位于 `backend/app/ingestion/contracts.py`，本阶段不包含网页爬虫或真实数据源连接。

## 前端启动

```bash
cd frontend
corepack enable
corepack prepare pnpm@9.15.9 --activate
pnpm install --frozen-lockfile
pnpm dev
```

打开终端输出的本地地址（默认 `http://localhost:5173/login`）。Mock 登录默认填充 `admin / 1234`，也可使用任意非空用户名和至少 4 位密码。

前端默认使用 Contract Mock。需要联调真实核心 API 时，先创建本地环境文件：

```bash
cp .env.example .env.local
```

将 `.env.local` 中的 `VITE_API_MODE` 改为 `real`，然后运行 `pnpm dev`。Vite 会将 `/api` 代理到 `http://localhost:8000`；登录使用 `admin / Admin-Phase2-2026!`。Real 模式下登录、专利和项目访问真实 API，内部搜索、外部监控和运营页仍使用 Contract Mock。

页面入口：

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

## 测试

后端本地测试：

```powershell
python -m pip install -r backend/requirements-dev.txt
python -m pytest
```

真实 PostgreSQL 验收顺序：

```powershell
docker compose up -d db
$env:DATABASE_URL="postgresql+psycopg://app:app@localhost:5432/intelligence_platform"
.\.venv\Scripts\python.exe scripts/migration_smoke.py
.\.venv\Scripts\python.exe scripts/seed_fixtures.py
.\.venv\Scripts\python.exe scripts/seed_fixtures.py
python -m pytest
```

前端检查：

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

页面只通过 `src/api/` 访问数据。Patent 和 Project API 会将 Shared OpenAPI DTO 转换为页面 ViewModel；前端不直连 PostgreSQL、OpenSearch 或外部专利站点。
