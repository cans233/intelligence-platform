import { CheckCircleOutlined, ClockCircleOutlined, CloudServerOutlined, ExclamationCircleOutlined, FileTextOutlined, FolderOpenOutlined, SafetyCertificateOutlined, SettingOutlined, TeamOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Button, Card, Col, Descriptions, Progress, Row, Space, Statistic, Table, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { documents, projects, technologies } from '../mocks'
import type { KnowledgeDocument, Technology } from '../types'

const { Paragraph, Text, Title } = Typography

export function KnowledgePage() {
  return <>
    <PageHeader eyebrow="内部知识 / KNOWLEDGE" title="知识库" description="从项目、技术主题和文档进入公司内部知识。" />
    <Row gutter={[16, 16]}>
      {[['技术主题', technologies.length, <ThunderboltOutlined />, '/technologies'], ['项目知识', projects.length, <FolderOpenOutlined />, '/projects'], ['内部文档', documents.length, <FileTextOutlined />, '/documents']].map(([label, value, icon, href]) => <Col xs={24} md={8} key={String(label)}><Link to={String(href)}><Card className="knowledge-entry" variant="borderless"><div className="knowledge-icon">{icon}</div><div><Text type="secondary">{label}</Text><Title level={3}>{value}</Title><Text>查看全部</Text></div></Card></Link></Col>)}
    </Row>
    <Card title="最近更新的内部知识" variant="borderless" className="mt16"><div className="knowledge-feed">{documents.slice(0, 3).map((document) => <Link to={`/documents#${document.id}`} key={document.id}><FileTextOutlined /><div><strong>{document.name}</strong><span>{document.project_name} · {document.updated_at}</span></div><Tag>{document.file_type}</Tag></Link>)}</div></Card>
  </>
}

export function TechnologiesPage() {
  return <>
    <PageHeader eyebrow="技术地图 / TECHNOLOGIES" title="技术库" description="按技术主题查看内部负责人、成熟阶段和关联关键词。" extra={<Button type="primary" icon={<ThunderboltOutlined />}>新建技术主题</Button>} />
    <Row gutter={[16, 16]}>{technologies.map((technology) => <Col xs={24} lg={12} xl={8} key={technology.id}><TechnologyCard technology={technology} /></Col>)}</Row>
  </>
}

function TechnologyCard({ technology }: { technology: Technology }) {
  return <Card id={technology.id} className="technology-card" variant="borderless" title={technology.name} extra={<Tag color="cyan">{technology.stage}</Tag>}><Text type="secondary">{technology.domain} · {technology.owner}负责</Text><Paragraph>{technology.description}</Paragraph><div className="tag-list">{technology.keywords.map((keyword) => <Tag key={keyword}>{keyword}</Tag>)}</div><Text type="secondary">更新于 {technology.updated_at}</Text></Card>
}

export function DocumentsPage() {
  const statusColor = { '已解析': 'green', '解析中': 'processing', '解析失败': 'red' }
  return <>
    <PageHeader eyebrow="内部资料 / DOCUMENTS" title="文档中心" description="查看项目文档及其版本、解析状态和负责人。" extra={<Button type="primary" icon={<FileTextOutlined />}>上传文档</Button>} />
    <Card className="table-card" variant="borderless"><Table rowKey="id" dataSource={documents} pagination={false} scroll={{ x: 920 }} columns={[
      { title: '文档', dataIndex: 'name', width: 300, render: (name: string, record: KnowledgeDocument) => <div id={record.id}><strong>{name}</strong><div className="table-sub">{record.summary}</div></div> },
      { title: '类型', dataIndex: 'file_type', render: (value: string) => <Tag>{value}</Tag> },
      { title: '所属项目', dataIndex: 'project_name', render: (value: string, record: KnowledgeDocument) => <Link to={`/projects/${record.project_id}`}>{value}</Link> },
      { title: '版本', dataIndex: 'version' },
      { title: '负责人', dataIndex: 'owner' },
      { title: '更新时间', dataIndex: 'updated_at' },
      { title: '解析状态', dataIndex: 'status', render: (value: KnowledgeDocument['status']) => <Tag color={statusColor[value]}>{value}</Tag> },
    ]} /></Card>
  </>
}

export function MonitoringPage() {
  const profiles = [
    { id: 'MON-08', name: '毫米波 VCO 全球专利监控', scope: 'CN / US / EP / WO', cadence: '每周一 08:00', lastRun: '2026-09-07 08:04', additions: 28, status: '运行中' },
    { id: 'MON-05', name: '功率器件热管理外部专利监控', scope: 'CN / JP / US', cadence: '每两周', lastRun: '2026-09-01 09:16', additions: 17, status: '运行中' },
    { id: 'MON-02', name: '边缘 AI 芯片低功耗专利监控', scope: 'CN / US', cadence: '已暂停', lastRun: '2026-08-26 11:40', additions: 11, status: '已暂停' },
  ]
  return <>
    <PageHeader eyebrow="外部情报 / MONITORING" title="专利监控" description="外部专利监控 Profile 在这里配置、调度和查看新增结果。" extra={<Button type="primary" icon={<ClockCircleOutlined />}>新建监控 Profile</Button>} />
    <Card className="table-card" variant="borderless"><Table rowKey="id" dataSource={profiles} pagination={false} scroll={{ x: 920 }} columns={[{ title: '外部专利监控 Profile', dataIndex: 'name', width: 320, render: (name, record) => <><strong>{name}</strong><div className="table-sub">{record.id}</div></> }, { title: '国家 / 地区', dataIndex: 'scope' }, { title: '调度', dataIndex: 'cadence' }, { title: '最近运行', dataIndex: 'lastRun' }, { title: '新增', dataIndex: 'additions', render: (value) => <Tag color="blue">+{value}</Tag> }, { title: '状态', dataIndex: 'status', render: (value) => <Tag color={value === '运行中' ? 'green' : 'default'}>{value}</Tag> }]} /></Card>
  </>
}

export function ReviewPage() {
  const queue = [{ key: '1', type: '来源字段冲突', target: 'CN117654321A', detail: '申请人名称在 CNIPA 与 EPO 不一致', owner: '未分配', age: '2 小时' }, { key: '2', type: '技术特征待核验', target: 'CN118765432A', detail: '系统增强生成 3 条候选技术特征', owner: '李明', age: '昨天' }]
  return <><PageHeader eyebrow="质量控制 / REVIEW" title="审核中心" description="集中处理来源冲突和待人工确认的系统结果。" extra={<Button icon={<SafetyCertificateOutlined />}>刷新队列</Button>} /><Card className="table-card" variant="borderless"><Table pagination={false} dataSource={queue} columns={[{ title: '类型', dataIndex: 'type', render: (value) => <Tag color="orange">{value}</Tag> }, { title: '对象', dataIndex: 'target' }, { title: '问题', dataIndex: 'detail' }, { title: '处理人', dataIndex: 'owner' }, { title: '等待时间', dataIndex: 'age' }, { title: '', render: () => <Button type="link">开始审核</Button> }]} /></Card></>
}

export function DataCenterPage() {
  return <><PageHeader eyebrow="数据运行 / DATA CENTER" title="数据中心" description="查看 Phase 1 Mock 数据源状态和最近任务。" extra={<Button icon={<CloudServerOutlined />}>刷新状态</Button>} /><Row gutter={[16, 16]}>{[['正常数据源', 2, <CheckCircleOutlined />, 'green'], ['限流数据源', 1, <ClockCircleOutlined />, 'amber'], ['失败任务', 1, <ExclamationCircleOutlined />, 'red']].map(([title, value, icon, color]) => <Col xs={24} md={8} key={String(title)}><Card className={`metric-card ${color}`} variant="borderless"><Statistic title={title} value={value as number} prefix={icon} /></Card></Col>)}</Row><Card title="数据源状态" variant="borderless" className="mt16"><div className="data-source-grid"><div><strong>CNIPA</strong><Progress percent={100} status="success" /><Text type="secondary">刚刚同步</Text></div><div><strong>EPO OPS</strong><Progress percent={100} status="success" /><Text type="secondary">12 分钟前同步</Text></div><div><strong>USPTO ODP</strong><Progress percent={62} strokeColor="#e5a52c" /><Text type="secondary">等待限流窗口恢复</Text></div></div></Card></>
}

export function AdminPage() {
  const users = [{ key: '1', name: '系统管理员', role: '管理员', scope: '全部数据', status: '启用' }, { key: '2', name: '周宁', role: '研发负责人', scope: '射频芯片项目', status: '启用' }, { key: '3', name: '陈悦', role: '研发人员', scope: '边缘 AI 项目', status: '启用' }]
  return <><PageHeader eyebrow="系统设置 / ADMIN" title="系统管理" description="查看 Mock 用户、角色和数据范围。" extra={<Button type="primary" icon={<TeamOutlined />}>添加用户</Button>} /><Row gutter={[16, 16]}><Col xs={24} xl={16}><Card title="用户与权限" variant="borderless"><Table size="small" pagination={false} dataSource={users} columns={[{ title: '用户', dataIndex: 'name' }, { title: '角色', dataIndex: 'role' }, { title: '数据范围', dataIndex: 'scope' }, { title: '状态', dataIndex: 'status', render: (value) => <Tag color="green">{value}</Tag> }]} /></Card></Col><Col xs={24} xl={8}><Card title="环境" extra={<SettingOutlined />} variant="borderless"><Descriptions column={1} size="small" items={[{ key: 'mode', label: '数据模式', children: 'Contract Mock' }, { key: 'api', label: 'API 前缀', children: '/api/v1' }, { key: 'phase', label: '当前阶段', children: 'Phase 1 cleanup' }]} /></Card></Col></Row></>
}
