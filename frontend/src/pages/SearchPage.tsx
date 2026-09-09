import { FileSearchOutlined } from '@ant-design/icons'
import { Button, Card, Checkbox, Input, Segmented, Select, Space, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchApi } from '../api/search'
import { PageHeader } from '../components/PageHeader'
import { SearchResultCard } from '../components/SearchResultCard'
import { StateBlock, stateFromUrl } from '../components/StateBlock'
import type { SearchResult } from '../types'

const { Text } = Typography

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const initial = params.get('q') ?? ''
  const [query, setQuery] = useState(initial)
  const [mode, setMode] = useState<'简单搜索' | '专业搜索'>('简单搜索')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<SearchResult[]>([])
  const [searched, setSearched] = useState(Boolean(initial))

  const runSearch = async (value = query) => {
    setLoading(true)
    setSearched(true)
    setParams(value ? { q: value } : {})
    const response = await searchApi.search(value)
    setItems(response.data.items)
    setLoading(false)
  }

  useEffect(() => { if (initial) void runSearch(initial) }, [])

  return <>
    <PageHeader eyebrow="探索 / SEARCH" title="全局检索" description="从专利、项目、技术和文档中找到可验证的关联。" extra={<Button icon={<FileSearchOutlined />} onClick={() => message.success('已保存为内部检索')}>保存内部检索</Button>} />
    <Card className="search-box" variant="borderless">
      <Segmented options={['简单搜索', '专业搜索']} value={mode} onChange={(value) => setMode(value as typeof mode)} />
      <Input.Search size="large" value={query} onChange={(event) => setQuery(event.target.value)} onSearch={runSearch} loading={loading} enterButton="搜索" placeholder={mode === '简单搜索' ? '输入关键词、专利号、项目或文档，例如：毫米波 VCO' : 'title:(VCO) AND ipc:H03B'} />
      <div className="search-hints"><Text type="secondary">试试：</Text>{['毫米波', '低功耗', 'CN118765432A'].map((value) => <button className="link-button" key={value} onClick={() => { setQuery(value); void runSearch(value) }}>{value}</button>)}</div>
    </Card>
    <div className="search-layout">
      <Card className="filter-card" title="筛选条件" variant="borderless"><FilterContent /></Card>
      <div className="results-column">
        <div className="result-toolbar"><Text type="secondary">{searched ? `找到 ${items.length} 条结果` : '输入关键词开始检索'}</Text><Select defaultValue="相关度" options={['相关度', '更新时间最新', '更新时间最早'].map((value) => ({ label: value, value }))} size="small" /></div>
        {stateFromUrl() ? <StateBlock type={stateFromUrl()} onRetry={() => window.history.replaceState({}, '', '/search')} /> : loading ? <StateBlock type="loading" /> : searched && items.length === 0 ? <StateBlock type="empty" onRetry={() => { setQuery(''); void runSearch('') }} /> : items.map((item) => <SearchResultCard item={item} key={`${item.kind}-${item.id}`} query={query} />)}
      </div>
    </div>
  </>
}

function FilterContent() {
  return <Space direction="vertical" size={16} className="filter-content">
    <div><Text strong>类型</Text><Checkbox.Group className="filter-options" options={['专利', '项目', '技术', '文档']} defaultValue={['专利', '项目', '技术', '文档']} /></div>
    <div><Text strong>国家 / 地区</Text><Select mode="multiple" placeholder="全部国家" options={['CN', 'US', 'EP', 'WO', 'JP'].map((value) => ({ label: value, value }))} /></div>
    <div><Text strong>状态</Text><Select mode="multiple" placeholder="全部状态" options={['有效', '申请中', '进行中', '待核验'].map((value) => ({ label: value, value }))} /></div>
    <div><Text strong>负责人 / 申请人</Text><Input placeholder="输入名称" /></div>
    <div><Text strong>时间范围</Text><Select placeholder="更新时间：全部" options={['最近 1 年', '最近 3 年', '最近 5 年'].map((value) => ({ label: value, value }))} /></div>
    <Button type="link" block>清除全部筛选</Button>
  </Space>
}
