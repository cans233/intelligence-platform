import { CheckCircleFilled, CopyOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Card, Col, Descriptions, Empty, Input, Pagination, Row, Select, Space, Table, Tabs, Tag, Timeline, Typography, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { patentApi } from '../api/patent'
import { DataCategoryTag, RecordQualityTag } from '../components/DataTags'
import { PageHeader } from '../components/PageHeader'
import { StateBlock, stateFromUrl } from '../components/StateBlock'
import type { PatentDetailDto, PatentListItemDto, PatentListQueryDto, RecordQuality } from '../types'

const { Paragraph, Text, Title } = Typography

export function PatentsPage() {
  const [query, setQuery] = useState<PatentListQueryDto>({ page: 1, page_size: 10 })
  const [items, setItems] = useState<PatentListItemDto[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async (next: PatentListQueryDto) => {
    setQuery(next)
    setLoading(true)
    setError(false)
    try {
      const response = await patentApi.list(next)
      setItems(response.data.items)
      setTotal(response.data.total)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load(query) }, [])
  const reset = () => void load({ page: 1, page_size: 10 })
  const forcedState = stateFromUrl()

  return <>
    <PageHeader eyebrow="证据资产 / PATENTS" title="专利库" description="浏览系统已入库的专利事实、记录质量和公司归属。" extra={<Tag color="blue">Contract 数据</Tag>} />
    <Card className="table-card" variant="borderless">
      <div className="patent-filters">
        <Input.Search value={query.keyword ?? ''} onChange={(event) => setQuery((current) => ({ ...current, keyword: event.target.value || undefined }))} onSearch={() => void load({ ...query, page: 1 })} placeholder="标题、公开号或申请人" enterButton="筛选" />
        <Select aria-label="专利国家地区" mode="multiple" value={query.countries} placeholder="全部国家" options={['CN', 'US', 'EP', 'WO'].map((value) => ({ label: value, value }))} onChange={(countries) => void load({ ...query, countries, page: 1 })} />
        <Select aria-label="专利记录质量" mode="multiple" value={query.qualities} placeholder="全部记录质量" options={[{ label: '已核验', value: 'VERIFIED' }, { label: '已标准化', value: 'NORMALIZED' }, { label: '来源冲突', value: 'CONFLICT' }, { label: '待核验', value: 'PENDING' }]} onChange={(qualities: RecordQuality[]) => void load({ ...query, qualities, page: 1 })} />
        <Button onClick={reset}>重置</Button>
      </div>
      {forcedState ? <StateBlock type={forcedState} onRetry={reset} /> : error ? <StateBlock type="error" onRetry={() => void load(query)} /> : loading ? <StateBlock type="loading" /> : items.length === 0 ? <StateBlock type="empty" onRetry={reset} /> : <><Table scroll={{ x: 1080 }} rowKey="id" dataSource={items} pagination={false} columns={[
        { title: '专利', dataIndex: 'title', width: 330, render: (title: string, record: PatentListItemDto) => <Link to={`/patents/${record.id}`}><strong>{title}</strong><div className="table-sub">{record.publication_number}</div></Link> },
        { title: '申请人', dataIndex: 'applicant', width: 240 },
        { title: '国家', dataIndex: 'country' },
        { title: '公开日', dataIndex: 'publication_date' },
        { title: 'IPC', dataIndex: 'ipc_codes', render: (codes: string[]) => codes.map((code) => <Tag key={code}>{code}</Tag>) },
        { title: '归属', dataIndex: 'ownership', render: (value: PatentListItemDto['ownership']) => <Tag color={value === 'COMPANY' ? 'cyan' : undefined}>{value === 'COMPANY' ? '公司专利' : '外部专利'}</Tag> },
        { title: '记录质量', dataIndex: 'record_quality', render: (value: RecordQuality) => <RecordQualityTag value={value} /> },
      ]} /><Pagination className="table-pagination" current={query.page} pageSize={query.page_size} total={total} showSizeChanger={false} onChange={(page) => void load({ ...query, page })} /></>}
    </Card>
  </>
}

export function PatentDetailPage() {
  const { id = '' } = useParams()
  const [patent, setPatent] = useState<PatentDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    setNotFound(false)
    try {
      const response = await patentApi.get(id)
      setPatent(response.data)
    } catch (requestError) {
      const missing = requestError instanceof ApiError ? requestError.status === 404 : requestError instanceof Error && requestError.message === 'PATENT_NOT_FOUND'
      setNotFound(missing)
      setError(!missing)
      setPatent(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { void load() }, [load])
  if (loading) return <><PageHeader eyebrow="专利详情 / LOADING" title="加载专利详情" /><StateBlock type="loading" /></>
  if (stateFromUrl()) return <><PageHeader eyebrow="专利详情 / STATE" title="专利详情" /><StateBlock type={stateFromUrl()} onRetry={() => void load()} /></>
  if (error) return <><PageHeader eyebrow="专利详情 / ERROR" title="专利详情暂不可用" /><StateBlock type="error" onRetry={() => void load()} /></>
  if (notFound || !patent) return <><PageHeader eyebrow="专利详情 / 404" title="找不到这件专利" /><Card variant="borderless"><Empty description="该专利不存在或已移除"><Link to="/patents"><Button type="primary">返回专利库</Button></Link></Empty></Card></>

  const facts = patent.official_facts
  return <>
    <div className="detail-breadcrumb"><Link to="/patents">专利库</Link><RightOutlined />{facts.publication_number}</div>
    <PageHeader eyebrow="专利详情 / EVIDENCE" title={patent.title} description={`${facts.publication_number} · ${facts.applicant_names.join('、')}`} extra={<Space wrap><RecordQualityTag value={patent.record_quality} /><Tag>{patent.ownership === 'COMPANY' ? '公司专利' : '外部专利'}</Tag><Button icon={<CopyOutlined />} onClick={() => { if (!navigator.clipboard) { message.error('当前浏览器不支持复制'); return } void navigator.clipboard.writeText(facts.publication_number).then(() => message.success('公开号已复制')).catch(() => message.error('复制失败，请手动复制')) }}>复制公开号</Button></Space>} />
    <Card className="detail-summary" title={<Space><DataCategoryTag value="OFFICIAL" /><span>官方基本事实</span></Space>} variant="borderless">
      <Descriptions column={{ xs: 1, sm: 2, lg: 4 }} items={[
        ['申请号', facts.application_number], ['公开日', facts.publication_date], ['申请日', facts.filing_date], ['优先权日', facts.priority_date], ['国家 / 地区', facts.country], ['法律状态', facts.legal_status], ['IPC', facts.ipc_codes.join(' · ') || '暂无'], ['CPC', facts.cpc_codes.join(' · ') || '暂无'], ['发明人', facts.inventor_names.join('、')], ['最近更新', patent.updated_at],
      ].map(([label, children]) => ({ key: label, label, children }))} />
    </Card>
    <div className="data-legend" aria-label="专利详情数据性质"><Text type="secondary">数据性质：</Text><DataCategoryTag value="OFFICIAL" /><DataCategoryTag value="NORMALIZED" /><DataCategoryTag value="AI" /><DataCategoryTag value="HUMAN" /></div>
    <Tabs className="detail-tabs" defaultActiveKey="overview" items={[
      { key: 'overview', label: '事实与标准化', children: <Overview patent={patent} /> },
      { key: 'claims', label: `权利要求 (${facts.claims.length})`, children: <Claims patent={patent} /> },
      { key: 'family', label: '专利族与引证', children: <Family patent={patent} /> },
      { key: 'legal', label: '法律状态', children: <LegalEvents patent={patent} /> },
      { key: 'sources', label: '来源与发现', children: <Sources patent={patent} /> },
      { key: 'analysis', label: '增强与人工结论', children: <Analysis patent={patent} /> },
    ]} />
  </>
}

function Overview({ patent }: { patent: PatentDetailDto }) {
  return <Row gutter={[16, 16]}>
    <Col xs={24} xl={15}><Card title={<Space><DataCategoryTag value="OFFICIAL" /><span>官方摘要</span></Space>} variant="borderless"><Paragraph>{patent.official_facts.abstract || '暂无官方摘要'}</Paragraph></Card></Col>
    <Col xs={24} xl={9}><Card title={<Space><DataCategoryTag value="NORMALIZED" /><span>系统标准化字段</span></Space>} variant="borderless">{patent.normalized_fields.length ? <Descriptions column={1} size="small" items={patent.normalized_fields.map((field) => ({ key: field.label, label: field.label, children: <div>{field.value}<div className="table-sub">来源：{field.source.join(' / ')}</div></div> }))} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无标准化字段" />}</Card></Col>
  </Row>
}

function Claims({ patent }: { patent: PatentDetailDto }) {
  return <Card title={<Space><DataCategoryTag value="OFFICIAL" /><span>权利要求</span></Space>} variant="borderless"><Space direction="vertical" size={16} className="claims-list">{patent.official_facts.claims.map((claim) => <div className={`claim ${claim.claim_type === '独立' ? 'independent' : ''}`} key={claim.claim_no}><div className="claim-label">权利要求 {claim.claim_no} <Tag color={claim.claim_type === '独立' ? 'blue' : undefined}>{claim.claim_type}</Tag></div><Paragraph>{claim.text}</Paragraph></div>)}</Space></Card>
}

function Family({ patent }: { patent: PatentDetailDto }) {
  const { family_members: family, citations } = patent.official_facts
  return <Row gutter={[16, 16]}>
    <Col xs={24} xl={14}><Card title={<Space><DataCategoryTag value="OFFICIAL" /><span>同族公开文本</span></Space>} variant="borderless">{family.length ? <Table size="small" pagination={false} dataSource={family} rowKey="id" columns={[{ title: '国家', dataIndex: 'country' }, { title: '公开号', dataIndex: 'publication_number' }, { title: '公开日', dataIndex: 'publication_date' }, { title: '状态', dataIndex: 'legal_status' }]} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无同族记录" />}</Card></Col>
    <Col xs={24} xl={10}><Card title={<Space><DataCategoryTag value="OFFICIAL" /><span>引用关系</span></Space>} variant="borderless">{citations.length ? <Table size="small" pagination={false} dataSource={citations} rowKey="id" columns={[{ title: '方向', dataIndex: 'direction' }, { title: '公开号', dataIndex: 'publication_number' }, { title: '标题', dataIndex: 'title' }]} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无已关联引证" />}</Card></Col>
  </Row>
}

function LegalEvents({ patent }: { patent: PatentDetailDto }) {
  const events = patent.official_facts.legal_events
  return <Card title={<Space><DataCategoryTag value="OFFICIAL" /><span>法律事件</span></Space>} variant="borderless">{events.length ? <Timeline items={events.map((event) => ({ children: <div><strong>{event.event}</strong><div className="table-sub">{event.date} · {event.source}</div></div> }))} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无法律事件" />}</Card>
}

function Sources({ patent }: { patent: PatentDetailDto }) {
  return <Row gutter={[16, 16]}>
    <Col xs={24} xl={15}><Card title="数据来源" variant="borderless"><Table scroll={{ x: 680 }} pagination={false} rowKey="source_record_id" dataSource={patent.sources} columns={[{ title: '来源', dataIndex: 'source', render: (value: string) => <Tag color="blue">{value}</Tag> }, { title: '源记录 ID', dataIndex: 'source_record_id' }, { title: '抓取时间', dataIndex: 'fetched_at' }, { title: '校验状态', dataIndex: 'status' }]} /></Card></Col>
    <Col xs={24} xl={9}><Card title="外部发现路径" variant="borderless"><div className="discovery-path">{patent.discovery_path.map((step, index) => <div key={`${step}-${index}`}><CheckCircleFilled /><span>{step}</span>{index < patent.discovery_path.length - 1 && <b>↓</b>}</div>)}</div></Card></Col>
  </Row>
}

function Analysis({ patent }: { patent: PatentDetailDto }) {
  const ai = patent.ai_enhancements
  const human = patent.human_conclusions
  return <Row gutter={[16, 16]}>
    <Col xs={24} lg={12}><Card title={<Space><DataCategoryTag value="AI" /><span>系统 / AI 增强</span></Space>} variant="borderless"><Descriptions column={1} size="small" items={[{ key: 'keywords', label: '关键词', children: ai.keywords.map((keyword) => <Tag key={keyword}>{keyword}</Tag>) }, { key: 'problem', label: '技术问题', children: ai.technical_problem || '暂无' }, { key: 'effect', label: '技术效果', children: ai.technical_effect || '暂无' }]} /></Card></Col>
    <Col xs={24} lg={12}><Card title={<Space><DataCategoryTag value="HUMAN" /><span>人工结论与公司项目关联</span></Space>} variant="borderless">{human.notes.length ? human.notes.map((note) => <Paragraph key={note}>{note}</Paragraph>) : <Text type="secondary">暂无人工备注</Text>}<div className="project-links">{human.project_links.length ? human.project_links.map((project) => <Link key={project.id} to={`/projects/${project.id}`}><Card size="small"><strong>{project.code} · {project.name}</strong><div className="table-sub">{project.relation}</div></Card></Link>) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无公司项目关联" />}</div></Card></Col>
  </Row>
}
