import { AppstoreOutlined, BookOutlined, BulbOutlined, CloudServerOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { Button, Card, Col, Progress, Row, Statistic, Table, Tag, Typography } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { monitoringApi } from '../api/monitoring'
import { patentApi } from '../api/patent'
import { projectApi } from '../api/project'
import { reviewApi } from '../api/review'
import { systemApi } from '../api/system'
import { PageHeader } from '../components/PageHeader'
import { StateBlock, stateFromUrl } from '../components/StateBlock'
import type { DataSourceStatusDto, JobRecordDto, MonitoringProfileDto, PatentListItemViewModel, ProjectListItemViewModel, ReviewItemDto } from '../types'

const { Text } = Typography
type DashboardData = { patents: PatentListItemViewModel[]; patentTotal: number; projects: ProjectListItemViewModel[]; profiles: MonitoringProfileDto[]; reviews: ReviewItemDto[]; sources: DataSourceStatusDto[]; jobs: JobRecordDto[] }
const emptyData: DashboardData = { patents: [], patentTotal: 0, projects: [], profiles: [], reviews: [], sources: [], jobs: [] }

export function DashboardPage() {
  const [data, setData] = useState<DashboardData>(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [patents, projects, profiles, reviews, system] = await Promise.all([patentApi.list({ page: 1, page_size: 3 }), projectApi.list(), monitoringApi.listProfiles(), reviewApi.list(), systemApi.getDataCenter()])
      setData({ patents: patents.data.items, patentTotal: patents.data.total, projects: projects.data.items, profiles: profiles.data.items, reviews: reviews.data.items, sources: system.data.sources, jobs: system.data.jobs })
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])
  const forcedState = stateFromUrl()
  const failedJobs = data.jobs.filter((item) => item.status === '失败')
  const newRecords = data.profiles.reduce((total, profile) => total + profile.new_record_count, 0)
  const stats = [
    { label: '已入库专利', value: data.patentTotal, note: 'Contract 当前总量', icon: <BookOutlined />, color: 'blue' },
    { label: '监控新增', value: newRecords, note: `${data.profiles.length} 个外部主题`, icon: <BulbOutlined />, color: 'amber' },
    { label: '关联项目', value: data.projects.length, note: `${data.projects.filter((item) => item.status === '进行中').length} 个进行中`, icon: <AppstoreOutlined />, color: 'violet' },
    { label: '待处理事项', value: data.reviews.length + failedJobs.length, note: '需关注', icon: <SafetyCertificateOutlined />, color: 'red' },
  ]

  return <>
    <PageHeader eyebrow="工作台 / DASHBOARD" title="早上好，管理员" description="从系统已拥有的数据和外部监控运行状态开始今日工作。" extra={<Button icon={<CloudServerOutlined />} loading={loading} onClick={() => void load()}>刷新数据</Button>} />
    {forcedState ? <StateBlock type={forcedState} onRetry={() => void load()} /> : error ? <StateBlock type="error" onRetry={() => void load()} /> : loading ? <StateBlock type="loading" /> : <div className="dashboard-grid">
      <Row gutter={[16, 16]}>{stats.map((item) => <Col xs={24} sm={12} xl={6} key={item.label}><Card className={`metric-card ${item.color}`} variant="borderless"><div className="metric-top"><span>{item.icon}</span><Text type="secondary">{item.label}</Text></div><Statistic value={item.value} /><div className="metric-delta">{item.note}</div></Card></Col>)}</Row>
      <Row gutter={[16, 16]} className="dash-row">
        <Col xs={24} xl={15}><Card title={<span>外部监控动态 <Text type="secondary" className="title-note">最近一次运行</Text></span>} extra={<Link to="/monitoring">查看全部</Link>} variant="borderless"><div className="topic-list">{data.profiles.map((profile) => { const rate = profile.candidate_count ? Math.round(profile.new_record_count / profile.candidate_count * 100) : 0; return <div className="topic-row" key={profile.id}><div className="topic-icon"><BulbOutlined /></div><div className="topic-main"><strong>{profile.name}</strong><span>候选 {profile.candidate_count} · 新增 {profile.new_record_count} · 失败 {profile.failure_count}</span></div><Tag color={profile.failure_count ? 'orange' : 'green'}>{profile.status === 'PAUSED' ? '已暂停' : profile.failure_count ? '需检查' : '正常'}</Tag><Progress percent={rate} showInfo={false} size="small" strokeColor={profile.failure_count ? '#e7a52d' : '#4da879'} /><Text type="secondary">{rate}%</Text></div> })}</div></Card></Col>
        <Col xs={24} xl={9}><Card title="待处理事项" extra={<Link to="/review">进入审核</Link>} variant="borderless"><div className="todo-list">{data.reviews.map((item) => <div className="todo-row" key={item.id}><span className={`todo-dot ${item.priority === '高' ? 'error' : 'warning'}`} /><div><strong>{item.type}</strong><span>{item.target} · {item.detail}</span></div><Text type="secondary">{item.status}</Text></div>)}{failedJobs.map((job) => <div className="todo-row" key={job.id}><span className="todo-dot error" /><div><strong>{job.type}失败</strong><span>{job.summary}</span></div><Text type="secondary">{job.started_at}</Text></div>)}</div></Card></Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}><Card title="最近入库" extra={<Link to="/patents">专利库</Link>} variant="borderless"><Table size="small" pagination={false} dataSource={data.patents} rowKey="id" columns={[{ title: '专利', dataIndex: 'title', render: (text: string, record: PatentListItemViewModel) => <Link to={`/patents/${record.id}`}><strong>{text}</strong><div className="table-sub">{record.publication_number}</div></Link> }, { title: '法律状态', dataIndex: 'legal_status', render: (value: string) => value || '暂无' }, { title: '数据来源', dataIndex: 'source_codes', render: (values: string[]) => values.join(' / ') || '暂无' }, { title: '公开日', dataIndex: 'publication_date', render: (value: string) => value || '暂无' }]} /></Card></Col>
        <Col xs={24} xl={9}><Card title="数据源健康" variant="borderless"><div className="source-health">{data.sources.map((source) => <div key={source.code}><span><i className={source.status === '正常' ? 'healthy' : 'warning'} />{source.label}</span><Text type="secondary">{source.last_sync_at}</Text><Tag color={source.status === '正常' ? 'green' : source.status === '异常' ? 'red' : 'orange'}>{source.status}</Tag></div>)}</div></Card></Col>
      </Row>
    </div>}
  </>
}
