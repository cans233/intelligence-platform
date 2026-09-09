import { Alert, Button, Card, Empty, Skeleton, Typography } from 'antd'
import { Link } from 'react-router-dom'

const { Paragraph, Text, Title } = Typography

export function StateBlock({ type, onRetry }: { type?: string | null; onRetry?: () => void }) {
  if (type === 'loading') return <Card variant="borderless"><Skeleton active paragraph={{ rows: 5 }} /></Card>
  if (type === 'error') return <Alert type="error" showIcon message="数据暂时不可用" description="请稍后重试；如果问题持续，请提供 trace_id：mock-error-001" action={<Button size="small" onClick={onRetry}>重试</Button>} />
  if (type === 'forbidden') return <Card variant="borderless"><div className="empty-state"><Text className="eyebrow">403</Text><Title level={3}>无权限访问</Title><Paragraph type="secondary">你的账号暂时没有查看这部分数据的权限。</Paragraph><Link to="/dashboard"><Button type="primary">回到工作台</Button></Link></div></Card>
  if (type === 'empty') return <Card variant="borderless"><Empty description="没有符合条件的记录"><Button type="primary" onClick={onRetry}>清除筛选</Button></Empty></Card>
  return null
}

export function stateFromUrl() {
  return new URLSearchParams(window.location.search).get('state')
}
