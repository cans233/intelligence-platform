import { BookOutlined, CheckCircleFilled, CopyOutlined, FileSearchOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Col, Descriptions, Empty, Input, Row, Select, Skeleton, Space, Table, Tabs, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { patentApi } from '../api/patent'
import { ConfidenceTag } from '../components/ConfidenceTag'
import { PageHeader } from '../components/PageHeader'
import { StateBlock, stateFromUrl } from '../components/StateBlock'
import type { Confidence, Patent } from '../types'

const { Paragraph, Text } = Typography

export function PatentsPage() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Patent[]>([])
  useEffect(() => { patentApi.list().then((response) => setItems(response.data.items)).finally(() => setLoading(false)) }, [])
  const columns = [
    { title: '专利', dataIndex: 'title', width: 360, render: (text: string, record: Patent) => <Link to={`/patents/${record.id}`}><strong>{text}</strong><div className="table-sub">{record.publication_number} · {record.application_number}</div></Link> },
    { title: '申请人', dataIndex: 'applicant_names', render: (value: string[]) => value[0] },
    { title: '公开日', dataIndex: 'publication_date' },
    { title: '国家', dataIndex: 'country', render: (value: string) => <Tag>{value}</Tag> },
    { title: 'IPC', dataIndex: 'ipc_codes', render: (value: string[]) => value.length ? value.map((code) => <Tag key={code}>{code}</Tag>) : <Text type="secondary">—</Text> },
    { title: '状态', dataIndex: 'confidence', render: (value: Confidence) => <ConfidenceTag value={value} /> },
    { title: '', key: 'action', render: (_: unknown, record: Patent) => <Link to={`/patents/${record.id}`}>查看详情</Link> },
  ]
  return <>
    <PageHeader eyebrow="事实库 / PATENTS" title="专利库" description="按结构化字段浏览已入库专利，保留每条记录的来源和可信状态。" extra={<Space><Button icon={<FileSearchOutlined />}>导出</Button><Button type="primary" icon={<BookOutlined />}>新增关注</Button></Space>} />
    <Card className="table-card" variant="borderless">
      <div className="patent-filters"><Input prefix={<SearchOutlined />} placeholder="筛选标题、公开号或申请人" style={{ maxWidth: 360 }} /><Select defaultValue="全部状态" options={['全部状态', '已核验', '系统标准化', '来源冲突'].map((value) => ({ label: value, value }))} /><Select defaultValue="全部国家" options={['全部国家', 'CN', 'US', 'EP'].map((value) => ({ label: value, value }))} /><Button>重置</Button></div>
      {stateFromUrl() ? <StateBlock type={stateFromUrl()} /> : loading ? <Skeleton active /> : <Table scroll={{ x: 1050 }} rowKey="id" dataSource={items} columns={columns} pagination={{ pageSize: 20, showTotal: (total) => `共 ${total} 条` }} />}
    </Card>
  </>
}

export function PatentDetailPage() {
  const { id = '' } = useParams()
  const [patent, setPatent] = useState<Patent | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { patentApi.get(id).then((response) => setPatent(response.data)).catch(() => setPatent(null)).finally(() => setLoading(false)) }, [id])
  if (loading) return <><PageHeader eyebrow="专利详情 / LOADING" title="加载专利详情" /><StateBlock type="loading" /></>
  if (!patent) return <><PageHeader eyebrow="专利详情" title="找不到这件专利" /><Card variant="borderless"><Empty description="该专利不存在或已移除"><Link to="/patents"><Button type="primary">返回专利库</Button></Link></Empty></Card></>
  return <>
    <div className="detail-breadcrumb"><Link to="/patents">专利库</Link><RightOutlined />{patent.publication_number}</div>
    <PageHeader eyebrow="专利详情 / EVIDENCE" title={patent.title} description={`${patent.publication_number} · ${patent.applicant_names[0]}`} extra={<Space wrap><ConfidenceTag value={patent.confidence} /><Button icon={<CopyOutlined />} onClick={() => navigator.clipboard?.writeText(patent.publication_number)}>复制公开号</Button><Button type="primary">关联项目</Button></Space>} />
    <Card className="detail-summary" variant="borderless"><Descriptions column={{ xs: 1, sm: 2, lg: 4 }} items={[['申请号', patent.application_number], ['公开日', patent.publication_date], ['申请日', patent.filing_date], ['优先权日', patent.priority_date], ['国家 / 地区', patent.country], ['法律状态', patent.legal_status], ['IPC', patent.ipc_codes.join(' · ') || '—'], ['CPC', patent.cpc_codes.join(' · ') || '—']].map(([label, children]) => ({ key: label, label, children }))} /></Card>
    <Tabs className="detail-tabs" defaultActiveKey="overview" items={[{ key: 'overview', label: '概览', children: <Overview patent={patent} /> }, { key: 'claims', label: `权利要求 (${patent.claims.length})`, children: <Claims patent={patent} /> }, { key: 'family', label: '专利族与引证', children: <Family patent={patent} /> }, { key: 'sources', label: '数据来源', children: <Sources patent={patent} /> }, { key: 'analysis', label: '技术分析', children: <Analysis /> }]} />
  </>
}

function Overview({ patent }: { patent: Patent }) {
  return <Row gutter={[16, 16]}><Col xs={24} xl={16}><Card title="官方摘要" variant="borderless"><Paragraph>{patent.abstract || '该记录暂无官方摘要，建议从来源页查看原始数据。'}</Paragraph></Card><Card title="发现路径" variant="borderless" className="mt16"><div className="discovery-line"><CheckCircleFilled />{patent.discovery_path}</div></Card></Col><Col xs={24} xl={8}><Card title="来源摘要" variant="borderless"><div className="provenance"><div><Text strong>主来源</Text><span>{patent.source_codes.join(' / ')}</span></div><div><Text strong>最近核验</Text><span>2026-09-07 09:42</span></div><div><Text strong>可信状态</Text><ConfidenceTag value={patent.confidence} /></div></div></Card></Col></Row>
}

function Claims({ patent }: { patent: Patent }) {
  return <Card variant="borderless"><Space direction="vertical" size={16} className="claims-list">{patent.claims.map((claim) => <div className={`claim ${claim.claim_type === '独立' ? 'independent' : ''}`} key={claim.claim_no}><div className="claim-label">权利要求 {claim.claim_no} <Tag color={claim.claim_type === '独立' ? 'blue' : undefined}>{claim.claim_type}</Tag></div><Paragraph>{claim.text}</Paragraph></div>)}</Space></Card>
}

function Family({ patent }: { patent: Patent }) {
  return <Row gutter={[16, 16]}><Col xs={24} xl={15}><Card title="同族公开文本" variant="borderless"><Table size="small" pagination={false} dataSource={[patent, { ...patent, id: 'family-us', country: 'US', publication_number: 'US20250123456A1', legal_status: '申请中' }, { ...patent, id: 'family-wo', country: 'WO', publication_number: 'WO2025034567A1', legal_status: '有效' }]} rowKey="id" columns={[{ title: '国家', dataIndex: 'country' }, { title: '公开号', dataIndex: 'publication_number' }, { title: '公开日', dataIndex: 'publication_date' }, { title: '状态', dataIndex: 'legal_status' }]} /></Card></Col><Col xs={24} xl={9}><Card title="引用关系" variant="borderless"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无已关联引证" /></Card></Col></Row>
}

function Sources({ patent }: { patent: Patent }) {
  return <Card variant="borderless"><Table scroll={{ x: 680 }} pagination={false} dataSource={patent.source_codes.map((source, index) => ({ key: source, source, id: `${source}-2025-001`, fetched: index ? '2026-09-06 18:20' : '2026-09-07 09:42', status: index ? '一致' : '已核验' }))} columns={[{ title: '来源', dataIndex: 'source', render: (value) => <Tag color="blue">{value}</Tag> }, { title: '源记录 ID', dataIndex: 'id' }, { title: '抓取时间', dataIndex: 'fetched' }, { title: '校验状态', dataIndex: 'status', render: (value) => <Tag color="green">{value}</Tag> }]} /></Card>
}

function Analysis() {
  return <Row gutter={[16, 16]}><Col xs={24} lg={12}><Card title="系统增强" extra={<Tag color="purple">AI</Tag>} variant="borderless"><Descriptions column={1} size="small" items={[['关键词', '毫米波 · 压控振荡器 · 低相噪'], ['技术问题', '提升多频段调谐线性度与温度稳定性'], ['技术效果', '降低相噪，缩短校准时间']].map(([label, children]) => ({ key: label, label, children }))} /></Card></Col><Col xs={24} lg={12}><Card title="人工结论" extra={<Tag color="gold">待补充</Tag>} variant="borderless"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无人工标签或备注" /></Card></Col></Row>
}
