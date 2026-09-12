import { FileTextOutlined, FolderOpenOutlined, ReadOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Card, Space, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'
import type { InternalSearchResultDto, SearchEntityType, SearchHighlightDto } from '../types'

const { Paragraph, Text, Title } = Typography
const kindMeta: Record<SearchEntityType, { label: string; color: string; icon: React.ReactNode }> = {
  patent: { label: '专利', color: 'blue', icon: <ReadOutlined /> },
  project: { label: '项目', color: 'purple', icon: <FolderOpenOutlined /> },
  technology: { label: '技术', color: 'cyan', icon: <ThunderboltOutlined /> },
  document: { label: '文档', color: 'gold', icon: <FileTextOutlined /> },
}

function renderSegments(highlight?: SearchHighlightDto) {
  return highlight?.segments.map((segment, index) => segment.highlighted ? <mark key={index}>{segment.text}</mark> : segment.text)
}

const resultHref = (item: InternalSearchResultDto) => item.type === 'patent' || item.type === 'project' ? `/${item.type}s/${item.id}` : `/${item.type === 'technology' ? 'technologies' : 'documents'}#${item.id}`

export function SearchResultCard({ item }: { item: InternalSearchResultDto }) {
  const kind = kindMeta[item.type]
  const title = item.highlights.find((value) => value.field === 'title')
  const snippet = item.highlights.find((value) => value.field === 'snippet')
  return <Card className="result-card" variant="borderless">
    <div className="result-heading"><div className="result-title"><Tag color={kind.color} icon={kind.icon}>{kind.label}</Tag><Link to={resultHref(item)}><Title level={4}>{renderSegments(title) ?? item.title}</Title></Link></div></div>
    <Space wrap className="result-meta">{item.publication_number && <Text>{item.publication_number}</Text>}{item.applicant && <Text>{item.applicant}</Text>}<Text type="secondary">更新 {item.updated_at}</Text></Space>
    <Paragraph ellipsis={{ rows: 2 }} className="result-abstract">{renderSegments(snippet) ?? item.snippet}</Paragraph>
    <div className="result-bottom"><Space wrap>{item.hit_reasons.map((reason) => <Tag color="blue" key={reason}>{reason}</Tag>)}</Space><Text type="secondary">来源：{item.source.join(' / ')}</Text></div>
  </Card>
}
