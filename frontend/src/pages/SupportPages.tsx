import { CheckCircleOutlined, ClockCircleOutlined, CloudServerOutlined, ExclamationCircleOutlined, FileTextOutlined, FolderOpenOutlined, HistoryOutlined, PlayCircleOutlined, SafetyCertificateOutlined, SettingOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Button, Card, Col, Descriptions, Drawer, Empty, Input, Modal, Progress, Row, Select, Space, Statistic, Table, Tag, Typography, message } from 'antd'
import type { InputRef } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { documentApi } from '../api/document'
import { getApiMode } from '../api/client'
import { monitoringApi } from '../api/monitoring'
import { projectApi } from '../api/project'
import { reviewApi } from '../api/review'
import { systemApi } from '../api/system'
import { technologyApi } from '../api/technology'
import { PageHeader } from '../components/PageHeader'
import { StateBlock, stateFromUrl } from '../components/StateBlock'
import type { AdminUserDto, CreateMonitoringProfileDto, DataSourceStatusDto, DocumentDto, JobRecordDto, MonitoringProfileDto, MonitoringRunDto, ProjectListItemViewModel, ReviewItemDto, TechnologyDto } from '../types'

const { Paragraph, Text, Title } = Typography

function usePageData<T>(loader: () => Promise<T>, initial: T) {
  const loaderRef = useRef(loader)
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      setData(await loaderRef.current())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { void load() }, [load])
  return { data, loading, error, load }
}

const pageState = (loading: boolean, error: boolean, empty = false) => stateFromUrl() || (error ? 'error' : loading ? 'loading' : empty ? 'empty' : null)

export function KnowledgePage() {
  const { data, loading, error, load } = usePageData(async () => {
    const [technologies, projects, documents] = await Promise.all([technologyApi.list(), projectApi.list(), documentApi.list()])
    return { technologies: technologies.data.items, projects: projects.data.items, documents: documents.data.items }
  }, { technologies: [] as TechnologyDto[], projects: [] as ProjectListItemViewModel[], documents: [] as DocumentDto[] })
  const state = pageState(loading, error)

  return <>
    <PageHeader eyebrow="内部知识 / KNOWLEDGE" title="知识库" description="从项目、技术主题和已解析文档进入公司内部知识。" />
    {state ? <StateBlock type={state} onRetry={() => void load()} /> : <>
      <Row gutter={[16, 16]}>
        {[['技术主题', data.technologies.length, <ThunderboltOutlined />, '/technologies'], ['项目知识', data.projects.length, <FolderOpenOutlined />, '/projects'], ['内部文档', data.documents.length, <FileTextOutlined />, '/documents']].map(([label, value, icon, href]) => <Col xs={24} md={8} key={String(label)}><Link to={String(href)}><Card className="knowledge-entry" variant="borderless"><div className="knowledge-icon">{icon}</div><div><Text type="secondary">{label}</Text><Title level={3}>{value}</Title><Text>查看全部</Text></div></Card></Link></Col>)}
      </Row>
      <Card title="最近更新的内部知识" variant="borderless" className="mt16">{data.documents.length ? <div className="knowledge-feed">{data.documents.slice(0, 4).map((document) => <Link to={`/documents#${document.id}`} key={document.id}><FileTextOutlined /><div><strong>{document.name}</strong><span>{document.project_name} · {document.updated_at} · {document.status}</span></div><Tag>{document.file_type}</Tag></Link>)}</div> : <Empty description="暂无内部文档" />}</Card>
    </>}
  </>
}

export function TechnologiesPage() {
  const { data: technologies, loading, error, load } = usePageData(() => technologyApi.list().then((response) => response.data.items), [] as TechnologyDto[])
  const [keyword, setKeyword] = useState('')
  const [domain, setDomain] = useState('ALL')
  const domains = useMemo(() => [...new Set(technologies.map((item) => item.domain))], [technologies])
  const visibleItems = technologies.filter((item) => (domain === 'ALL' || item.domain === domain) && (!keyword || [item.name, item.owner, item.description, ...item.keywords].join(' ').toLowerCase().includes(keyword.toLowerCase())))
  const reset = () => { setKeyword(''); setDomain('ALL') }
  const state = pageState(loading, error, visibleItems.length === 0)

  return <>
    <PageHeader eyebrow="技术地图 / TECHNOLOGIES" title="技术库" description={`共 ${technologies.length} 个技术主题；按领域、负责人和关键词浏览。`} />
    <Card className="filter-bar" variant="borderless"><Input prefix={<ThunderboltOutlined />} value={keyword} placeholder="筛选技术名称、负责人或关键词" onChange={(event) => setKeyword(event.target.value)} /><Select aria-label="技术领域" value={domain} options={[{ label: '全部领域', value: 'ALL' }, ...domains.map((value) => ({ label: value, value }))]} onChange={setDomain} /><Button onClick={reset}>重置</Button></Card>
    {state ? <StateBlock type={state} onRetry={state === 'error' ? () => void load() : reset} /> : <Row gutter={[16, 16]}>{visibleItems.map((technology) => <Col xs={24} lg={12} xl={8} key={technology.id}><TechnologyCard technology={technology} /></Col>)}</Row>}
  </>
}

function TechnologyCard({ technology }: { technology: TechnologyDto }) {
  return <Card id={technology.id} className="technology-card" variant="borderless" title={technology.name} extra={<Tag color="cyan">{technology.stage}</Tag>}><Text type="secondary">{technology.domain} · {technology.owner}负责</Text><Paragraph>{technology.description}</Paragraph><div className="tag-list">{technology.keywords.map((keyword) => <Tag key={keyword}>{keyword}</Tag>)}</div><Space wrap>{technology.project_ids.map((id) => <Link key={id} to={`/projects/${id}`}>查看所属项目</Link>)}<Text type="secondary">更新于 {technology.updated_at}</Text></Space></Card>
}

export function DocumentsPage() {
  const { data: documents, loading, error, load } = usePageData(() => documentApi.list().then((response) => response.data.items), [] as DocumentDto[])
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<DocumentDto['status'] | 'ALL'>('ALL')
  const [project, setProject] = useState('ALL')
  const projects = useMemo(() => [...new Map(documents.map((item) => [item.project_id, item.project_name])).entries()], [documents])
  const visibleItems = documents.filter((item) => (status === 'ALL' || item.status === status) && (project === 'ALL' || item.project_id === project) && (!keyword || [item.name, item.owner, item.summary].join(' ').toLowerCase().includes(keyword.toLowerCase())))
  const reset = () => { setKeyword(''); setStatus('ALL'); setProject('ALL') }
  const state = pageState(loading, error, visibleItems.length === 0)
  const statusColor: Record<DocumentDto['status'], string> = { '已解析': 'green', '解析中': 'processing', '解析失败': 'red' }

  return <>
    <PageHeader eyebrow="内部资料 / DOCUMENTS" title="文档中心" description={`共 ${documents.length} 份项目文档；展示版本、归属、更新时间和解析状态。`} />
    <Card className="filter-bar" variant="borderless"><Input prefix={<FileTextOutlined />} value={keyword} placeholder="筛选文档名称、负责人或摘要" onChange={(event) => setKeyword(event.target.value)} /><Select aria-label="文档解析状态" value={status} options={[{ label: '全部解析状态', value: 'ALL' }, ...(['已解析', '解析中', '解析失败'] as const).map((value) => ({ label: value, value }))]} onChange={setStatus} /><Select aria-label="文档所属项目" value={project} options={[{ label: '全部项目', value: 'ALL' }, ...projects.map(([value, label]) => ({ label, value }))]} onChange={setProject} /><Button onClick={reset}>重置</Button></Card>
    <Card className="table-card" variant="borderless">{state ? <StateBlock type={state} onRetry={state === 'error' ? () => void load() : reset} /> : <Table rowKey="id" dataSource={visibleItems} pagination={false} scroll={{ x: 1040 }} columns={[
      { title: '文档', dataIndex: 'name', width: 320, render: (name: string, record: DocumentDto) => <div id={record.id}><strong>{name}</strong><div className="table-sub">{record.summary}</div></div> },
      { title: '类型', dataIndex: 'file_type', render: (value: string) => <Tag>{value}</Tag> },
      { title: '所属项目', dataIndex: 'project_name', render: (value: string, record: DocumentDto) => <Link to={`/projects/${record.project_id}`}>{value}</Link> },
      { title: '版本', dataIndex: 'version' },
      { title: '负责人', dataIndex: 'owner' },
      { title: '更新时间', dataIndex: 'updated_at' },
      { title: '解析状态', dataIndex: 'status', render: (value: DocumentDto['status']) => <Tag color={statusColor[value]}>{value}</Tag> },
    ]} />}</Card>
  </>
}

const newProfile = (): CreateMonitoringProfileDto => ({ name: '', query: '', countries: ['CN'], sources: ['CNIPA'], schedule: '每周一 08:00' })

export function MonitoringPage() {
  const [profiles, setProfiles] = useState<MonitoringProfileDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState(newProfile)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyProfile, setHistoryProfile] = useState<MonitoringProfileDto | null>(null)
  const [runs, setRuns] = useState<MonitoringRunDto[]>([])
  const [runsLoading, setRunsLoading] = useState(false)
  const [runningId, setRunningId] = useState<string | null>(null)
  const createInput = useRef<InputRef>(null)
  const historyStart = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const response = await monitoringApi.listProfiles()
      setProfiles([...response.data.items])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { void load() }, [load])

  const create = async () => {
    if (!draft.name.trim() || !draft.query.trim() || !draft.countries.length || !draft.sources.length) return
    setCreating(true)
    try {
      await monitoringApi.createProfile({ ...draft, name: draft.name.trim(), query: draft.query.trim() })
      await load()
      setCreateOpen(false)
      setDraft(newProfile())
      message.success('外部监控主题已创建')
    } catch {
      message.error('创建失败，请稍后重试')
    } finally {
      setCreating(false)
    }
  }

  const openHistory = async (profile: MonitoringProfileDto) => {
    setHistoryProfile(profile)
    setHistoryOpen(true)
    setRunsLoading(true)
    try {
      const response = await monitoringApi.listRuns(profile.id)
      setRuns(response.data.items)
    } catch {
      setRuns([])
      message.error('运行历史加载失败')
    } finally {
      setRunsLoading(false)
    }
  }

  const runNow = async (profile: MonitoringProfileDto) => {
    setRunningId(profile.id)
    try {
      await monitoringApi.runNow(profile.id)
      await load()
      message.success(`已受理“${profile.name}”立即执行请求`)
    } catch {
      message.error('立即执行请求失败')
    } finally {
      setRunningId(null)
    }
  }

  const state = pageState(loading, error, profiles.length === 0)
  const valid = Boolean(draft.name.trim() && draft.query.trim() && draft.schedule.trim() && draft.countries.length && draft.sources.length)

  return <>
    <PageHeader eyebrow="外部情报 / MONITORING" title="专利监控" description="配置外部检索主题、查看运行指标和发现入口；与内部搜索相互独立。" extra={<Button type="primary" icon={<ClockCircleOutlined />} onClick={() => setCreateOpen(true)}>新建监控主题</Button>} />
    <Card className="table-card" variant="borderless">{state ? <StateBlock type={state} onRetry={() => void load()} /> : <Table rowKey="id" dataSource={profiles} pagination={false} scroll={{ x: 1710 }} columns={[
      { title: '外部监控主题', dataIndex: 'name', width: 350, render: (name: string, record: MonitoringProfileDto) => <div className="monitor-name"><strong>{name}</strong><div className="table-sub">{record.id} · {record.query}</div><div className="table-sub">外部发现入口：{record.sources.join(' → ')}</div></div> },
      { title: '状态', dataIndex: 'status', width: 90, render: (value: MonitoringProfileDto['status']) => <Tag color={value === 'ACTIVE' ? 'green' : value === 'RUNNING' ? 'processing' : value === 'FAILED' ? 'red' : 'default'}>{({ ACTIVE: '运行中', PAUSED: '已暂停', RUNNING: '执行中', FAILED: '异常' })[value]}</Tag> },
      { title: '国家 / 地区', dataIndex: 'countries', width: 140, render: (values: string[]) => values.join(' / ') },
      { title: '数据源', dataIndex: 'sources', width: 250, render: (values: string[]) => values.map((value) => <Tag key={value}>{value}</Tag>) },
      { title: '调度', dataIndex: 'schedule', width: 150 },
      { title: '最近 / 下次运行', width: 230, render: (_: unknown, record: MonitoringProfileDto) => <><div>{record.last_run_at}</div><div className="table-sub">下次：{record.next_run_at}</div></> },
      { title: '候选', dataIndex: 'candidate_count', width: 70 },
      { title: '新增', dataIndex: 'new_record_count', width: 70, render: (value: number) => <Tag color="blue">{value}</Tag> },
      { title: '重复', dataIndex: 'duplicate_count', width: 70 },
      { title: '失败', dataIndex: 'failure_count', width: 70, render: (value: number) => <Text type={value ? 'danger' : undefined}>{value}</Text> },
      { title: '操作', width: 220, render: (_: unknown, record: MonitoringProfileDto) => <Space><Button size="small" icon={<HistoryOutlined />} onClick={() => void openHistory(record)}>历史</Button><Button size="small" type="primary" icon={<PlayCircleOutlined />} loading={runningId === record.id} onClick={() => void runNow(record)}>立即执行</Button></Space> },
    ]} />}</Card>
    <Modal title="新建外部监控主题" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={() => void create()} afterOpenChange={(open) => { if (open) createInput.current?.focus() }} okText="创建" cancelText="取消" confirmLoading={creating} okButtonProps={{ disabled: !valid }}>
      <Space direction="vertical" size={14} className="modal-form">
        <label><Text strong>主题名称</Text><Input ref={createInput} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="例如：毫米波 VCO 全球专利监控" /></label>
        <label><Text strong>外部检索条件</Text><Input.TextArea value={draft.query} onChange={(event) => setDraft((current) => ({ ...current, query: event.target.value }))} placeholder="关键词或检索式" autoSize={{ minRows: 2, maxRows: 4 }} /></label>
        <label><Text strong>国家 / 地区</Text><Select mode="multiple" value={draft.countries} options={['CN', 'US', 'EP', 'WO', 'JP'].map((value) => ({ label: value, value }))} onChange={(countries) => setDraft((current) => ({ ...current, countries }))} /></label>
        <label><Text strong>数据源</Text><Select mode="multiple" value={draft.sources} options={['CNIPA', 'EPO OPS', 'USPTO ODP'].map((value) => ({ label: value, value }))} onChange={(sources) => setDraft((current) => ({ ...current, sources }))} /></label>
        <label><Text strong>调度</Text><Input value={draft.schedule} onChange={(event) => setDraft((current) => ({ ...current, schedule: event.target.value }))} /></label>
      </Space>
    </Modal>
    <Drawer title={historyProfile ? `${historyProfile.name} · 运行历史` : '运行历史'} width={720} open={historyOpen} onClose={() => setHistoryOpen(false)} afterOpenChange={(open) => { if (open) historyStart.current?.focus() }}>
      <div ref={historyStart} tabIndex={-1} className="drawer-intro">运行历史记录</div>
      {runsLoading ? <StateBlock type="loading" /> : runs.length ? <Table rowKey="id" size="small" pagination={false} scroll={{ x: 780 }} dataSource={runs} columns={[{ title: '运行 ID', dataIndex: 'id' }, { title: '状态', dataIndex: 'status' }, { title: '开始时间', dataIndex: 'started_at' }, { title: '候选', dataIndex: 'candidate_count' }, { title: '新增', dataIndex: 'new_record_count' }, { title: '重复', dataIndex: 'duplicate_count' }, { title: '失败', dataIndex: 'failure_count' }]} /> : <Empty description="暂无运行历史" />}
    </Drawer>
  </>
}

export function ReviewPage() {
  const { data: items, loading, error, load } = usePageData(() => reviewApi.list().then((response) => response.data.items), [] as ReviewItemDto[])
  const [priority, setPriority] = useState<ReviewItemDto['priority'] | 'ALL'>('ALL')
  const [status, setStatus] = useState<ReviewItemDto['status'] | 'ALL'>('ALL')
  const [selected, setSelected] = useState<ReviewItemDto | null>(null)
  const detailStart = useRef<HTMLDivElement>(null)
  const visibleItems = items.filter((item) => (priority === 'ALL' || item.priority === priority) && (status === 'ALL' || item.status === status))
  const reset = () => { setPriority('ALL'); setStatus('ALL') }
  const state = pageState(loading, error, visibleItems.length === 0)

  return <>
    <PageHeader eyebrow="质量控制 / REVIEW" title="审核中心" description="筛选来源冲突和待人工确认结果，并查看只读详情。" extra={<Button icon={<SafetyCertificateOutlined />} onClick={() => void load()}>刷新队列</Button>} />
    <Card className="filter-bar" variant="borderless"><Select aria-label="审核优先级" value={priority} options={[{ label: '全部优先级', value: 'ALL' }, ...(['高', '中', '低'] as const).map((value) => ({ label: value, value }))]} onChange={setPriority} /><Select aria-label="审核状态" value={status} options={[{ label: '全部状态', value: 'ALL' }, ...(['待处理', '处理中'] as const).map((value) => ({ label: value, value }))]} onChange={setStatus} /><Button onClick={reset}>重置</Button></Card>
    <Card className="table-card" variant="borderless">{state ? <StateBlock type={state} onRetry={state === 'error' ? () => void load() : reset} /> : <Table rowKey="id" pagination={false} dataSource={visibleItems} scroll={{ x: 920 }} columns={[{ title: '类型', dataIndex: 'type', render: (value: string) => <Tag color="orange">{value}</Tag> }, { title: '对象', dataIndex: 'target' }, { title: '问题', dataIndex: 'detail', width: 340 }, { title: '优先级', dataIndex: 'priority' }, { title: '处理人', dataIndex: 'owner' }, { title: '状态', dataIndex: 'status' }, { title: '进入队列', dataIndex: 'created_at' }, { title: '', render: (_: unknown, record: ReviewItemDto) => <Button type="link" onClick={() => setSelected(record)}>查看只读详情</Button> }]} />}</Card>
    <Drawer title="审核项只读详情" width={520} open={Boolean(selected)} onClose={() => setSelected(null)} afterOpenChange={(open) => { if (open) detailStart.current?.focus() }}><div ref={detailStart} tabIndex={-1} className="drawer-intro">审核项字段</div>{selected && <Descriptions column={1} bordered size="small" items={Object.entries({ '审核编号': selected.id, '类型': selected.type, '对象': selected.target, '问题说明': selected.detail, '优先级': selected.priority, '处理人': selected.owner, '状态': selected.status, '进入队列': selected.created_at }).map(([label, children]) => ({ key: label, label, children }))} />}</Drawer>
  </>
}

export function DataCenterPage() {
  const { data, loading, error, load } = usePageData(() => systemApi.getDataCenter().then((response) => response.data), { sources: [] as DataSourceStatusDto[], jobs: [] as JobRecordDto[] })
  const state = pageState(loading, error)
  const normal = data.sources.filter((item) => item.status === '正常').length
  const limited = data.sources.filter((item) => item.status === '限流').length
  const failed = data.jobs.filter((item) => item.status === '失败').length

  return <>
    <PageHeader eyebrow="数据运行 / DATA CENTER" title="数据中心" description="查看数据源健康和最近任务记录。" extra={<Button icon={<CloudServerOutlined />} onClick={() => void load()}>刷新状态</Button>} />
    {state ? <StateBlock type={state} onRetry={() => void load()} /> : <>
      <Row gutter={[16, 16]}>{[['正常数据源', normal, <CheckCircleOutlined />, 'green'], ['限流数据源', limited, <ClockCircleOutlined />, 'amber'], ['失败任务', failed, <ExclamationCircleOutlined />, 'red']].map(([title, value, icon, color]) => <Col xs={24} md={8} key={String(title)}><Card className={`metric-card ${color}`} variant="borderless"><Statistic title={title} value={value as number} prefix={icon} /></Card></Col>)}</Row>
      <Card title="数据源健康" variant="borderless" className="mt16"><div className="data-source-grid">{data.sources.map((source) => <div key={source.code}><Space><strong>{source.label}</strong><Tag color={source.status === '正常' ? 'green' : source.status === '限流' ? 'orange' : 'red'}>{source.status}</Tag></Space><Progress percent={source.success_rate} status={source.status === '异常' ? 'exception' : source.status === '正常' ? 'success' : 'normal'} strokeColor={source.status === '限流' ? '#e5a52c' : undefined} /><Text type="secondary">最近同步：{source.last_sync_at}</Text></div>)}</div></Card>
      <Card title="最近任务" variant="borderless" className="mt16"><Table rowKey="id" pagination={false} scroll={{ x: 760 }} dataSource={data.jobs} columns={[{ title: '任务', dataIndex: 'id' }, { title: '类型', dataIndex: 'type' }, { title: '来源', dataIndex: 'source' }, { title: '状态', dataIndex: 'status', render: (value: JobRecordDto['status']) => <Tag color={value === '成功' ? 'green' : value === '失败' ? 'red' : 'processing'}>{value}</Tag> }, { title: '开始时间', dataIndex: 'started_at' }, { title: '结果', dataIndex: 'summary' }]} /></Card>
    </>}
  </>
}

export function AdminPage() {
  const { data: users, loading, error, load } = usePageData(() => systemApi.listUsers().then((response) => response.data.items), [] as AdminUserDto[])
  const state = pageState(loading, error, users.length === 0)
  const mode = getApiMode()

  return <>
    <PageHeader eyebrow="系统设置 / ADMIN" title="系统管理" description="查看用户、角色、数据范围和当前 API 运行模式。" />
    {state ? <StateBlock type={state} onRetry={() => void load()} /> : <Row gutter={[16, 16]}><Col xs={24} xl={16}><Card title="用户与权限" variant="borderless"><Table rowKey="id" size="small" pagination={false} dataSource={users} columns={[{ title: '用户', dataIndex: 'name' }, { title: '角色', dataIndex: 'role' }, { title: '数据范围', dataIndex: 'data_scope' }, { title: '状态', dataIndex: 'status', render: (value: AdminUserDto['status']) => <Tag color={value === '启用' ? 'green' : 'default'}>{value}</Tag> }]} /></Card></Col><Col xs={24} xl={8}><Card title="环境" extra={<SettingOutlined />} variant="borderless"><Descriptions column={1} size="small" items={[{ key: 'mode', label: '数据模式', children: mode === 'mock' ? 'Contract Mock' : 'Real API' }, { key: 'api', label: 'API 前缀', children: import.meta.env.VITE_API_BASE_URL ?? '/api/v1' }, { key: 'phase', label: '当前阶段', children: 'B Phase 2' }, { key: 'write', label: '管理操作', children: '本阶段只读' }]} /></Card></Col></Row>}
  </>
}
