import { FileTextOutlined, FolderOpenOutlined, ReadOutlined, SearchOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Card, Space, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'
import type { SearchKind, SearchResult } from '../types'
import { ConfidenceTag } from './ConfidenceTag'

const { Paragraph, Text, Title } = Typography
const kindMeta: Record<SearchKind, { label: string; color: string; icon: React.ReactNode }> = {
  patent: { label: '专利', color: 'blue', icon: <ReadOutlined /> },
  project: { label: '项目', color: 'purple', icon: <FolderOpenOutlined /> },
  technology: { label: '技术', color: 'cyan', icon: <ThunderboltOutlined /> },
  document: { label: '文档', color: 'gold', icon: <FileTextOutlined /> },
}

function highlight(text: string, query: string) {
  if (!query.trim()) return text
  const terms = query.trim().split(/\s+/).filter(Boolean)
  const re = new RegExp(`(${terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'ig')
  return text.split(re).map((part, index) => terms.some((term) => part.toLowerCase() === term.toLowerCase()) ? <mark key={index}>{part}</mark> : part)
}

export function SearchResultCard({ item, query }: { item: SearchResult; query: string }) {
  const kind = kindMeta[item.kind]
  return <Card className="result-card" variant="borderless">
    <div className="result-heading"><div className="result-title"><Tag color={kind.color} icon={kind.icon}>{kind.label}</Tag><Link to={item.href}><Title level={4}>{highlight(item.title, query)}</Title></Link></div>{item.confidence && <ConfidenceTag value={item.confidence} />}</div>
    <Space wrap className="result-meta"><Text>{item.subtitle}</Text><Text type="secondary">更新 {item.updated_at}</Text>{item.tags.slice(0, 3).map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space>
    <Paragraph ellipsis={{ rows: 2 }} className="result-abstract">{highlight(item.excerpt, query)}</Paragraph>
    <div className="result-bottom"><Space wrap>{item.hit_reasons.map((reason) => <Tag color="blue" key={reason}>{reason}</Tag>)}</Space>{item.discovery_path && <Text type="secondary"><SearchOutlined /> {item.discovery_path}</Text>}</div>
  </Card>
}
