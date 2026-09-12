import { AppstoreOutlined, FileTextOutlined, ReadOutlined, RightOutlined, SearchOutlined, TeamOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Button, Card, Col, Descriptions, Empty, Input, Row, Select, Space, Statistic, Table, Tag, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { projectApi } from '../api/project'
import { RecordQualityTag } from '../components/DataTags'
import { PageHeader } from '../components/PageHeader'
import { StateBlock, stateFromUrl } from '../components/StateBlock'
import type { DocumentDto, ProjectDetailDto, ProjectPatentRelation, TechnologyDto } from '../types'

const { Paragraph, Text, Title } = Typography
const statusColor: Record<ProjectDetailDto['status'], string> = { '进行中': 'green', '观察中': 'orange', '已归档': 'default' }

export function ProjectsPage() {
  const [items, setItems] = useState<ProjectDetailDto[]>([])
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<ProjectDetailDto['status'] | 'ALL'>('ALL')
  const [owner, setOwner] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async (value = keyword) => {
    setLoading(true)
    setError(false)
    try {
      const response = await projectApi.list(value)
      setItems(response.data.items)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [keyword])

  useEffect(() => { void load('') }, [])
  const owners = useMemo(() => [...new Set(items.map((item) => item.owner))], [items])
  const visibleItems = items.filter((item) => (status === 'ALL' || item.status === status) && (owner === 'ALL' || item.owner === owner))
  const reset = () => { setKeyword(''); setStatus('ALL'); setOwner('ALL'); void load('') }
  const forcedState = stateFromUrl()

  return <>
    <PageHeader eyebrow="协作空间 / PROJECTS" title="项目库" description="按项目身份查看组织、技术、文档、公司专利与外部相关专利。" extra={<Tag icon={<AppstoreOutlined />} color="blue">只读业务视图</Tag>} />
    <Card className="table-card" variant="borderless">
      <div className="project-toolbar">
        <Input.Search prefix={<SearchOutlined />} value={keyword} placeholder="筛选项目名称、编号或负责人" onChange={(event) => setKeyword(event.target.value)} onSearch={() => void load()} enterButton="筛选" />
        <Space wrap>
          <Select aria-label="项目状态" value={status} options={[{ label: '全部状态', value: 'ALL' }, ...(['进行中', '观察中', '已归档'] as const).map((value) => ({ label: value, value }))]} onChange={setStatus} />
          <Select aria-label="项目负责人" value={owner} options={[{ label: '全部负责人', value: 'ALL' }, ...owners.map((value) => ({ label: value, value }))]} onChange={setOwner} />
          <Button onClick={reset}>重置</Button>
        </Space>
      </div>
      {forcedState ? <StateBlock type={forcedState} onRetry={reset} /> : error ? <StateBlock type="error" onRetry={() => void load()} /> : loading ? <StateBlock type="loading" /> : visibleItems.length === 0 ? <StateBlock type="empty" onRetry={reset} /> : <Table rowKey="id" dataSource={visibleItems} pagination={false} scroll={{ x: 1080 }} columns={[
        { title: '项目', dataIndex: 'name', width: 290, render: (name: string, record: ProjectDetailDto) => <Link to={`/projects/${record.id}`}><strong>{name}</strong><div className="table-sub">{record.code}</div></Link> },
        { title: '组织 / 部门', width: 220, render: (_: unknown, record: ProjectDetailDto) => <><div>{record.organization}</div><div className="table-sub">{record.department}</div></> },
        { title: '负责人', dataIndex: 'owner' },
        { title: '阶段', dataIndex: 'stage' },
        { title: '技术', dataIndex: 'technologies', render: (values: TechnologyDto[]) => values.slice(0, 2).map((value) => <Tag key={value.id}>{value.name}</Tag>) },
        { title: '专利关系', render: (_: unknown, record: ProjectDetailDto) => `${record.company_patents.length} 公司 / ${record.external_related_patents.length} 外部` },
        { title: '状态', dataIndex: 'status', render: (value: ProjectDetailDto['status']) => <Tag color={statusColor[value]}>{value}</Tag> },
        { title: '更新日期', dataIndex: 'updated_at' },
      ]} />}
    </Card>
  </>
}

export function ProjectDetailPage() {
  const { id = '' } = useParams()
  const [project, setProject] = useState<ProjectDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    setNotFound(false)
    try {
      const response = await projectApi.get(id)
      setProject(response.data)
    } catch (requestError) {
      const missing = requestError instanceof ApiError ? requestError.status === 404 : requestError instanceof Error && requestError.message === 'PROJECT_NOT_FOUND'
      setNotFound(missing)
      setError(!missing)
      setProject(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { void load() }, [load])
  if (loading) return <><PageHeader eyebrow="项目详情 / LOADING" title="加载项目详情" /><StateBlock type="loading" /></>
  if (stateFromUrl()) return <><PageHeader eyebrow="项目详情 / STATE" title="项目详情" /><StateBlock type={stateFromUrl()} onRetry={() => void load()} /></>
  if (error) return <><PageHeader eyebrow="项目详情 / ERROR" title="项目详情暂不可用" /><StateBlock type="error" onRetry={() => void load()} /></>
  if (notFound || !project) return <><PageHeader eyebrow="项目详情 / 404" title="找不到这个项目" /><Card variant="borderless"><Empty description="该项目不存在或已归档移除"><Link to="/projects"><Button type="primary">返回项目库</Button></Link></Empty></Card></>

  return <>
    <div className="detail-breadcrumb"><Link to="/projects">项目库</Link><RightOutlined />{project.code}</div>
    <PageHeader eyebrow="项目详情 / PROJECT" title={project.name} description={project.description} extra={<Space><Tag color={statusColor[project.status]}>{project.status}</Tag><Tag>只读</Tag></Space>} />
    <Row gutter={[16, 16]} className="project-metrics">
      <Metric title="技术主题" value={project.technologies.length} icon={<ThunderboltOutlined />} />
      <Metric title="内部文档" value={project.documents.length} icon={<FileTextOutlined />} />
      <Metric title="专利关系" value={project.company_patents.length + project.external_related_patents.length} icon={<ReadOutlined />} />
      <Metric title="项目成员" value={project.member_count} icon={<TeamOutlined />} />
    </Row>
    <Card title="项目身份" variant="borderless">
      <Descriptions column={{ xs: 1, md: 2, xl: 4 }} items={[
        ['项目编号', project.code], ['组织', project.organization], ['部门', project.department], ['负责人', project.owner], ['当前阶段', project.stage], ['状态', project.status], ['风险等级', project.risk], ['最近更新', project.updated_at],
      ].map(([label, children]) => ({ key: label, label, children }))} />
    </Card>
    <Row gutter={[16, 16]} className="mt16">
      <Col xs={24} xl={12}><TechnologyRelations items={project.technologies} /></Col>
      <Col xs={24} xl={12}><DocumentRelations items={project.documents} /></Col>
      <Col xs={24}><PatentRelations title="公司专利" description="公司自有或申请主体为公司的正式专利关系。" items={project.company_patents} /></Col>
      <Col xs={24}><PatentRelations title="外部相关专利" description="由外部监控或分析发现，并附带相关度与关联原因。" items={project.external_related_patents} showReason /></Col>
    </Row>
  </>
}

function Metric({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return <Col xs={12} lg={6}><Card variant="borderless"><Statistic title={title} value={value} prefix={icon} /></Card></Col>
}

function TechnologyRelations({ items }: { items: TechnologyDto[] }) {
  return <Card title="技术" variant="borderless" className="full-height">{items.length ? <div className="relation-list">{items.map((item) => <div key={item.id}><Link to={`/technologies#${item.id}`}><Title level={5}>{item.name}</Title></Link><Text type="secondary">{item.domain} · {item.stage} · {item.owner}</Text><Paragraph>{item.description}</Paragraph></div>)}</div> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无关联技术" />}</Card>
}

function DocumentRelations({ items }: { items: DocumentDto[] }) {
  return <Card title="文档" variant="borderless" className="full-height">{items.length ? <div className="document-list">{items.map((item) => <div key={item.id}><FileTextOutlined /><div><Link to={`/documents#${item.id}`}><strong>{item.name}</strong></Link><Paragraph type="secondary">{item.version} · {item.status} · {item.updated_at}</Paragraph></div><Tag>{item.file_type}</Tag></div>)}</div> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无关联文档" />}</Card>
}

function PatentRelations({ title, description, items, showReason = false }: { title: string; description: string; items: ProjectPatentRelation[]; showReason?: boolean }) {
  return <Card title={title} extra={<Text type="secondary">{description}</Text>} variant="borderless">{items.length ? <Table rowKey="id" pagination={false} scroll={{ x: 920 }} dataSource={items} columns={[
    { title: '专利', dataIndex: 'title', width: 320, render: (value: string, record: ProjectPatentRelation) => <Link to={`/patents/${record.id}`}><strong>{value}</strong><div className="table-sub">{record.publication_number}</div></Link> },
    { title: '申请人', dataIndex: 'applicant' },
    { title: '国家', dataIndex: 'country' },
    { title: '记录质量', dataIndex: 'record_quality', render: (value: ProjectPatentRelation['record_quality']) => <RecordQualityTag value={value} /> },
    { title: '相关度', dataIndex: 'relevance', render: (value: ProjectPatentRelation['relevance']) => <Tag color={value === '高' ? 'green' : value === '中' ? 'blue' : 'default'}>{value}</Tag> },
    ...(showReason ? [{ title: '关联原因', dataIndex: 'relation_reason', width: 300 }] : []),
  ]} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`暂无${title}`} />}</Card>
}
