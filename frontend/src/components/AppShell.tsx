import { AppstoreOutlined, BellOutlined, BookOutlined, ClockCircleOutlined, DatabaseOutlined, FileTextOutlined, HomeOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, MoreOutlined, ReadOutlined, SafetyCertificateOutlined, SearchOutlined, SettingOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Avatar, Badge, Button, Dropdown, Input, Layout, Menu, Space, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { getApiMode } from '../api/client'
import { DashboardPage } from '../pages/DashboardPage'
import { PatentDetailPage, PatentsPage } from '../pages/PatentPages'
import { ProjectDetailPage, ProjectsPage } from '../pages/ProjectPages'
import { SearchPage } from '../pages/SearchPage'
import { AdminPage, DataCenterPage, DocumentsPage, KnowledgePage, MonitoringPage, ReviewPage, TechnologiesPage } from '../pages/SupportPages'

const { Header, Sider, Content } = Layout
const { Text } = Typography

const navItems = [
  { key: '/dashboard', icon: <HomeOutlined />, label: '工作台' },
  { key: '/search', icon: <SearchOutlined />, label: '内部搜索' },
  { key: '/patents', icon: <BookOutlined />, label: '专利库' },
  { key: '/projects', icon: <AppstoreOutlined />, label: '项目库' },
  { key: '/knowledge', icon: <ReadOutlined />, label: '知识库' },
  { key: '/technologies', icon: <ThunderboltOutlined />, label: '技术库' },
  { key: '/documents', icon: <FileTextOutlined />, label: '文档中心' },
  { key: '/monitoring', icon: <ClockCircleOutlined />, label: '专利监控' },
  { key: '/review', icon: <SafetyCertificateOutlined />, label: '审核中心' },
  { key: '/data-center', icon: <DatabaseOutlined />, label: '数据中心' },
  { key: '/admin', icon: <SettingOutlined />, label: '系统管理' },
]

export function AppShell({ onLogout }: { onLogout: () => void }) {
  const [collapsed, setCollapsed] = useState(false)
  const [narrow, setNarrow] = useState(() => window.matchMedia?.('(max-width: 1100px)').matches ?? false)
  const [search, setSearch] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const effectiveCollapsed = collapsed || narrow
  const active = navItems.find((item) => location.pathname.startsWith(item.key))?.key ?? '/dashboard'

  useEffect(() => {
    const query = window.matchMedia('(max-width: 1100px)')
    const update = () => setNarrow(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return <Layout className={`app-shell ${effectiveCollapsed ? 'is-collapsed' : ''}`}>
    <a className="skip-link" href="#main-content">跳到主要内容</a>
    <Sider className="app-sider" width={248} collapsedWidth={72} collapsed={effectiveCollapsed} trigger={null}>
      <div className="sider-brand"><div className="brand-mark">{effectiveCollapsed ? '知' : <>知脉<span>·</span></>}</div>{!effectiveCollapsed && <Text className="brand-sub">INTELLIGENCE PLATFORM</Text>}</div>
      <Menu theme="dark" mode="inline" selectedKeys={[active]} items={navItems} onClick={({ key }) => navigate(key)} />
      <div className="sider-bottom">{!effectiveCollapsed && <div className="sider-tip"><Text>数据边界</Text><strong>已隔离</strong><span>内部搜索 · 外部监控</span></div>}{!narrow && <Button type="text" icon={effectiveCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} aria-label={effectiveCollapsed ? '展开导航' : '收起导航'} />}</div>
    </Sider>
    <Layout>
      <Header className="app-header">
        <div className="header-search"><Input value={search} onChange={(event) => setSearch(event.target.value)} onPressEnter={() => navigate(`/search?q=${encodeURIComponent(search)}`)} prefix={<SearchOutlined />} placeholder="搜索系统已拥有的数据" variant="borderless" aria-label="搜索系统已拥有的数据" /></div>
        <Space size={18}><Tag color="blue">{getApiMode() === 'mock' ? 'CONTRACT MOCK' : 'REAL CORE · CONTRACT MOCK'}</Tag><Badge dot><Button type="text" icon={<BellOutlined />} aria-label="通知" /></Badge><Dropdown menu={{ items: [{ key: 'profile', label: '账号设置', icon: <SettingOutlined /> }, { type: 'divider' }, { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: onLogout }] }}><Button type="text" className="user-menu"><Avatar size={30} style={{ background: '#d8edff', color: '#155b8a' }}>管</Avatar><span>系统管理员</span><MoreOutlined /></Button></Dropdown></Space>
      </Header>
      <Content id="main-content" tabIndex={-1} className="app-content"><Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/patents" element={<PatentsPage />} />
        <Route path="/patents/:id" element={<PatentDetailPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/technologies" element={<TechnologiesPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/monitoring" element={<MonitoringPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/data-center" element={<DataCenterPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes></Content>
    </Layout>
  </Layout>
}
