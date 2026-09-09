import { AppstoreOutlined, BookOutlined, BulbOutlined, CloudServerOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { Button, Card, Col, Progress, Row, Statistic, Table, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { StateBlock, stateFromUrl } from '../components/StateBlock'
import { patents, projects } from '../mocks'

const { Text } = Typography

export function DashboardPage() {
  const stats = [
    { label: '专利总量', value: '12,846', delta: '+3.2%', icon: <BookOutlined />, color: 'blue' },
    { label: '本周新增', value: '128', delta: '+18.5%', icon: <BulbOutlined />, color: 'amber' },
    { label: '关联项目', value: String(projects.length).padStart(2, '0'), delta: 'Phase 1 Mock', icon: <AppstoreOutlined />, color: 'violet' },
    { label: '待处理事项', value: '09', delta: '需关注', icon: <SafetyCertificateOutlined />, color: 'red' },
  ]
  return <>
    <PageHeader eyebrow="工作台 / 2026.09.09" title="早上好，管理员" description="今天也从一条可验证的技术线索开始。" extra={<Button icon={<CloudServerOutlined />}>刷新数据</Button>} />
    <StateBlock type={stateFromUrl()} onRetry={() => window.history.replaceState({}, '', '/dashboard')} />
    <div className="dashboard-grid">
      <Row gutter={[16, 16]}>{stats.map((item) => <Col xs={24} sm={12} xl={6} key={item.label}><Card className={`metric-card ${item.color}`} variant="borderless"><div className="metric-top"><span>{item.icon}</span><Text type="secondary">{item.label}</Text></div><Statistic value={item.value} /><div className="metric-delta">{item.delta}</div></Card></Col>)}</Row>
      <Row gutter={[16, 16]} className="dash-row">
        <Col xs={24} xl={15}><Card title={<span>重点主题动态 <Text type="secondary" className="title-note">近 7 天</Text></span>} extra={<Link to="/monitoring">查看全部</Link>} variant="borderless"><div className="topic-list">{[['毫米波 VCO', '28', '高相关', '82%'], ['功率器件热管理', '17', '待审核', '56%'], ['边缘 AI 推理', '11', '高相关', '41%']].map(([name, count, badge, percent]) => <div className="topic-row" key={name}><div className="topic-icon"><BulbOutlined /></div><div className="topic-main"><strong>{name}</strong><span>近 7 天新增 {count} 件</span></div><Tag color={badge === '待审核' ? 'orange' : 'green'}>{badge}</Tag><Progress percent={Number(percent.replace('%', ''))} showInfo={false} size="small" strokeColor={badge === '待审核' ? '#e7a52d' : '#4da879'} /><Text type="secondary">{percent}</Text></div>)}</div></Card></Col>
        <Col xs={24} xl={9}><Card title="待处理事项" extra={<Link to="/review">进入审核</Link>} variant="borderless"><div className="todo-list">{[['来源字段冲突', 'CN117654321A · 申请人', '2 小时前', 'error'], ['AI 技术特征待核验', '3 条增强结果', '昨天', 'warning'], ['解析任务失败', 'DOCX-20260907-08', '昨天', 'default']].map(([title, sub, time, type]) => <div className="todo-row" key={title}><span className={`todo-dot ${type}`} /><div><strong>{title}</strong><span>{sub}</span></div><Text type="secondary">{time}</Text></div>)}</div></Card></Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}><Card title="最近入库" extra={<Link to="/patents">专利库</Link>} variant="borderless"><Table size="small" pagination={false} dataSource={patents.slice(0, 3)} rowKey="id" columns={[{ title: '专利', dataIndex: 'title', render: (text, record) => <Link to={`/patents/${record.id}`}><strong>{text}</strong><div className="table-sub">{record.publication_number}</div></Link> }, { title: '来源', dataIndex: 'source_codes', render: (value: string[]) => value.map((source) => <Tag key={source}>{source}</Tag>) }, { title: '入库时间', dataIndex: 'publication_date' }]} /></Card></Col>
        <Col xs={24} xl={9}><Card title="数据源健康" variant="borderless"><div className="source-health">{[['CNIPA', '刚刚', '正常'], ['EPO OPS', '12 分钟前', '正常'], ['USPTO ODP', '昨天 18:42', '限流']].map(([name, time, status]) => <div key={name}><span><i className={status === '正常' ? 'healthy' : 'warning'} />{name}</span><Text type="secondary">{time}</Text><Tag color={status === '正常' ? 'green' : 'orange'}>{status}</Tag></div>)}</div></Card></Col>
      </Row>
    </div>
  </>
}
