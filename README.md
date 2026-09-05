# intelligence-platform

第一阶段提供 FastAPI、PostgreSQL、SQLAlchemy、Alembic、Docker Compose 和基础专利事实模型。

## 启动

1. 复制 `.env.example` 为 `.env`，按需修改数据库密码。
2. 执行 `docker compose up --build`。
3. 访问 `http://localhost:8000/api/health`。

API 容器启动时会自动执行 Alembic 迁移。数据库表位于 PostgreSQL 的 `patent` schema，当前包含：

- `patent.family`
- `patent.application`
- `patent.publication`
- `patent.claim`
- `patent.source_record`

## 测试

本地安装依赖后执行：

```powershell
python -m pip install -r backend/requirements-dev.txt
python -m pytest
```

仅验证容器配置和数据库迁移时，可执行：

```powershell
docker compose config
docker compose up --build
```
