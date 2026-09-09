import { AppstoreOutlined, FileTextOutlined, ReadOutlined, RightOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons'
import { Button, Card, Col, Descriptions, Empty, Input, Row, Skeleton, Space, Statistic, Table, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { projectApi } from '../api/project'
import { ConfidenceTag } from '../components/ConfidenceTag'
import { PageHeader } from '../components/PageHeader'
import { StateBlock, stateFromUrl } from '../components/StateBlock'
import { documents, patents } from '../mocks'
import type { Project } from '../types'

const { Paragraph, Text } = Typography
const statusColor = { '进行中': 'green', '观察中': 'orange', '已归档': 'default' }

export function ProjectsPage() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Project[]>([])
  useEffect(() => { projectApi.list().then((response) => setItems(response.data.items)).finally(() => setLoading(false)) }, [])
  return <>
    <PageHeader eyebrow="协作空间 / PROJECTS" title="项目库" description="汇总项目目标、技术主题以及关联的专利和内部文档。" extra={<Button type="primary" icon={<AppstoreOutlined />}>新建项目</Button>} />
    <Card className="table-card" variant="borderless">
      <div className="project-toolbar"><Input prefix={<SearchOutlined />} placeholder="筛选项目名称、编号或负责人" /><Space><Tag color="blue">{items.filter((item) => item.status === '进行中').length} 个进行中</Tag><Tag>{items.length} 个项目</Tag></Space></div>
      {stateFromUrl() ? <StateBlock type={stateFromUrl()} /> : loading ? <Skeleton active /> : <Table rowKey="id" dataSource={items} pagination={false} scroll={{ x: 880 }} columns={[
        { title: '项目', dataIndex: 'name', width: 300, render: (name: string, record: Project) => <Link to={`/projects/${record.id}`}><strong>{name}</strong><div className="table-sub">{record.code}</div></Link> },
        { title: '负责人', dataIndex: 'owner' },
        { title: '阶段', dataIndex: 'stage' },
        { title: '技术主题', dataIndex: 'technologies', render: (values: string[]) => values.slice(0, 2).map((value) => <Tag key={value}>{value}</Tag>) },
        { title: '状态', dataIndex: 'status', render: (value: Project['status']) => <Tag color={statusColor[value]}>{value}</Tag> },
        { title: '更新日期', dataIndex: 'updated_at' },
        { title: '', render: (_: unknown, record: Project) => <Link to={`/projects/${record.id}`}>查看详情</Link> },
      ]} />}
    </Card>
  </>
}

export function ProjectDetailPage() {
  const { id = '' } = useParams()
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)
  useEffect(() => { projectApi.get(id).then((response) => setProject(response.data)).catch(() => setProject(null)).finally(() => setLoading(false)) }, [id])
  if (loading) return <><PageHeader eyebrow="项目详情 / LOADING" title="加载项目详情" /><StateBlock type="loading" /></>
  if (!project) return <><PageHeader eyebrow="项目详情" title="找不到这个项目" /><Card variant="borderless"><Empty description="该项目不存在或已归档移除"><Link to="/projects"><Button type="primary">返回项目库</Button></Link></Empty></Card></>
  const linkedPatents = patents.filter((patent) => project.patent_ids.includes(patent.id))
  const linkedDocuments = documents.filter((document) => project.document_ids.includes(document.id))
  return <>
    <div className="detail-breadcrumb"><Link to="/projects">项目库</Link><RightOutlined />{project.code}</div>
    <PageHeader eyebrow="项目详情 / MOCK" title={project.name} description={project.description} extra={<Space><Tag color={statusColor[project.status]}>{project.status}</Tag><Button type="primary">编辑项目</Button></Space>} />
    <Row gutter={[16, 16]} className="project-metrics">
      <Col xs={12} lg={6}><Card variant="borderless"><Statistic title="关联专利" value={linkedPatents.length} prefix={<ReadOutlined />} /></Card></Col>
      <Col xs={12} lg={6}><Card variant="borderless"><Statistic title="项目文档" value={linkedDocuments.length} prefix={<FileTextOutlined />} /></Card></Col>
      <Col xs={12} lg={6}><Card variant="borderless"><Statistic title="成员" value={project.member_count} prefix={<TeamOutlined />} /></Card></Col>
      <Col xs={12} lg={6}><Card variant="borderless"><Statistic title="风险等级" value={project.risk} /></Card></Col>
    </Row>
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={8}><Card title="项目概况" variant="borderless" className="full-height"><Descriptions column={1} size="small" items={[['项目编号', project.code], ['负责人', project.owner], ['当前阶段', project.stage], ['最近更新', project.updated_at]].map(([label, children]) => ({ key: label, label, children }))} /><Text strong>技术主题</Text><div className="tag-list">{project.technologies.map((technology) => <Tag color="blue" key={technology}>{technology}</Tag>)}</div></Card></Col>
      <Col xs={24} xl={16}><Card title="关联专利" extra={<Button size="small">关联专利</Button>} variant="borderless"><Table rowKey="id" pagination={false} dataSource={linkedPatents} locale={{ emptyText: '暂无关联专利' }} columns={[{ title: '专利', dataIndex: 'title', render: (title: string, patent) => <Link to={`/patents/${patent.id}`}><strong>{title}</strong><div className="table-sub">{patent.publication_number}</div></Link> }, { title: '可信状态', dataIndex: 'confidence', render: (value) => <ConfidenceTag value={value} /> }]} /></Card></Col>
    </Row>
    <Card title="项目文档" variant="borderless" className="mt16"><div className="document-list">{linkedDocuments.length ? linkedDocuments.map((document) => <div key={document.id}><FileTextOutlined /><div><strong>{document.name}</strong><Paragraph type="secondary">{document.file_type} · {document.version} · {document.updated_at}</Paragraph></div><Tag color={document.status === '已解析' ? 'green' : 'orange'}>{document.status}</Tag></div>) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无项目文档" />}</div></Card>
  </>
}
