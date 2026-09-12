import { FileSearchOutlined } from '@ant-design/icons'
import { Button, Card, Checkbox, Input, Modal, Pagination, Select, Space, Typography, message } from 'antd'
import type { InputRef } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { projectApi } from '../api/project'
import { searchApi } from '../api/search'
import { technologyApi } from '../api/technology'
import { PageHeader } from '../components/PageHeader'
import { SearchResultCard } from '../components/SearchResultCard'
import { StateBlock } from '../components/StateBlock'
import type { InternalSearchQueryDto, InternalSearchResultDto, SearchEntityType, SearchSort } from '../types'

const { Text } = Typography
const allTypes: SearchEntityType[] = ['patent', 'project', 'technology', 'document']
const typeOptions = [
  { label: '专利', value: 'patent' },
  { label: '项目', value: 'project' },
  { label: '技术', value: 'technology' },
  { label: '文档', value: 'document' },
]

export const emptySearchQuery = (): InternalSearchQueryDto => ({
  keyword: '',
  types: [...allTypes],
  ipc_codes: [],
  cpc_codes: [],
  countries: [],
  project_ids: [],
  technology_tags: [],
  sort: 'relevance',
  page: 1,
  page_size: 5,
})

const listParam = (params: URLSearchParams, key: string) => params.get(key)?.split(',').filter(Boolean) ?? []

export function searchQueryFromParams(params: URLSearchParams): InternalSearchQueryDto {
  const defaults = emptySearchQuery()
  const requestedTypes = listParam(params, 'types').filter((value): value is SearchEntityType => allTypes.includes(value as SearchEntityType))
  const page = Number(params.get('page'))
  return {
    ...defaults,
    keyword: params.get('q') ?? '',
    types: requestedTypes.length ? requestedTypes : defaults.types,
    date_from: params.get('from') || undefined,
    date_to: params.get('to') || undefined,
    applicant: params.get('applicant') || undefined,
    ipc_codes: listParam(params, 'ipc'),
    cpc_codes: listParam(params, 'cpc'),
    countries: listParam(params, 'countries'),
    project_ids: listParam(params, 'projects'),
    technology_tags: listParam(params, 'tags'),
    sort: ['relevance', 'updated_desc', 'updated_asc'].includes(params.get('sort') ?? '') ? params.get('sort') as SearchSort : defaults.sort,
    page: Number.isInteger(page) && page > 0 ? page : defaults.page,
  }
}

export function searchQueryToParams(query: InternalSearchQueryDto) {
  const params = new URLSearchParams()
  const set = (key: string, value?: string) => { if (value) params.set(key, value) }
  set('q', query.keyword)
  if (query.types.length !== allTypes.length) set('types', query.types.join(','))
  set('from', query.date_from)
  set('to', query.date_to)
  set('applicant', query.applicant)
  set('ipc', query.ipc_codes.join(','))
  set('cpc', query.cpc_codes.join(','))
  set('countries', query.countries.join(','))
  set('projects', query.project_ids.join(','))
  set('tags', query.technology_tags.join(','))
  if (query.sort !== 'relevance') set('sort', query.sort)
  if (query.page > 1) set('page', String(query.page))
  return params
}

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const [draft, setDraft] = useState(() => searchQueryFromParams(params))
  const [items, setItems] = useState<InternalSearchResultDto[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)
  const [projectOptions, setProjectOptions] = useState<{ label: string; value: string }[]>([])
  const [technologyOptions, setTechnologyOptions] = useState<{ label: string; value: string }[]>([])
  const controller = useRef<AbortController | null>(null)
  const saveInput = useRef<InputRef>(null)

  const runSearch = useCallback(async (next: InternalSearchQueryDto) => {
    controller.current?.abort()
    const request = new AbortController()
    controller.current = request
    setDraft(next)
    setParams(searchQueryToParams(next), { replace: true })
    setLoading(true)
    setError(false)
    try {
      const response = await searchApi.search(next, request.signal)
      setItems(response.data.items)
      setTotal(response.data.total)
    } catch (requestError) {
      if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) setError(true)
    } finally {
      if (!request.signal.aborted) setLoading(false)
    }
  }, [setParams])

  useEffect(() => {
    if (params.get('state')) setLoading(false)
    else void runSearch(searchQueryFromParams(params))
    void Promise.all([projectApi.list(), technologyApi.list()]).then(([projectResponse, technologyResponse]) => {
      setProjectOptions(projectResponse.data.items.map((item) => ({ label: `${item.code} · ${item.name}`, value: item.id })))
      setTechnologyOptions(technologyResponse.data.items.map((item) => ({ label: item.name, value: item.name })))
    }).catch(() => undefined)
    return () => controller.current?.abort()
  }, [])

  const update = <K extends keyof InternalSearchQueryDto>(key: K, value: InternalSearchQueryDto[K]) => setDraft((current) => ({ ...current, [key]: value, page: 1 }))
  const submit = () => void runSearch({ ...draft, page: 1 })
  const reset = () => void runSearch(emptySearchQuery())
  const forcedState = params.get('state')

  const save = async () => {
    if (!saveName.trim()) return
    setSaving(true)
    try {
      await searchApi.save({ name: saveName.trim(), query: draft })
      message.success('内部检索已保存')
      setSaveOpen(false)
      setSaveName('')
    } catch {
      message.error('保存失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  return <>
    <PageHeader eyebrow="内部数据 / SEARCH" title="内部全局搜索" description="只搜索系统已经拥有的专利、项目、技术和文档。" extra={<Button icon={<FileSearchOutlined />} onClick={() => setSaveOpen(true)}>保存内部检索</Button>} />
    <Card className="search-box" variant="borderless">
      <Input.Search size="large" value={draft.keyword} onChange={(event) => update('keyword', event.target.value)} onSearch={submit} loading={loading} enterButton="搜索内部数据" placeholder="输入关键词、专利号、项目或文档，例如：毫米波 VCO" aria-label="搜索系统已拥有的数据" />
      <div className="search-hints"><Text type="secondary">试试：</Text>{['毫米波', '低功耗', 'CN118765432A'].map((value) => <button className="link-button" key={value} onClick={() => void runSearch({ ...draft, keyword: value, page: 1 })}>{value}</button>)}</div>
    </Card>
    <div className="search-layout">
      <Card className="filter-card" title="筛选条件" variant="borderless">
        <Space direction="vertical" size={16} className="filter-content">
          <Filter label="类型"><Checkbox.Group className="filter-options" options={typeOptions} value={draft.types} onChange={(value) => update('types', value as SearchEntityType[])} /></Filter>
          <Filter label="更新时间"><div className="date-range"><input type="date" aria-label="开始日期" value={draft.date_from ?? ''} onChange={(event) => update('date_from', event.target.value || undefined)} /><span>至</span><input type="date" aria-label="结束日期" value={draft.date_to ?? ''} onChange={(event) => update('date_to', event.target.value || undefined)} /></div></Filter>
          <Filter label="申请人"><Input value={draft.applicant ?? ''} placeholder="输入申请人名称" onChange={(event) => update('applicant', event.target.value || undefined)} /></Filter>
          <Filter label="IPC"><Select mode="tags" value={draft.ipc_codes} placeholder="输入 IPC 分类号" onChange={(value) => update('ipc_codes', value)} /></Filter>
          <Filter label="CPC"><Select mode="tags" value={draft.cpc_codes} placeholder="输入 CPC 分类号" onChange={(value) => update('cpc_codes', value)} /></Filter>
          <Filter label="国家 / 地区"><Select mode="multiple" value={draft.countries} placeholder="全部国家" options={['CN', 'US', 'EP', 'WO', 'JP'].map((value) => ({ label: value, value }))} onChange={(value) => update('countries', value)} /></Filter>
          <Filter label="所属项目"><Select mode="multiple" value={draft.project_ids} placeholder="全部项目" options={projectOptions} onChange={(value) => update('project_ids', value)} /></Filter>
          <Filter label="技术标签"><Select mode="tags" value={draft.technology_tags} placeholder="输入或选择标签" options={technologyOptions} onChange={(value) => update('technology_tags', value)} /></Filter>
          <Space><Button type="primary" onClick={submit}>应用筛选</Button><Button onClick={reset}>清除全部</Button></Space>
        </Space>
      </Card>
      <div className="results-column">
        <div className="result-toolbar"><Text type="secondary">找到 {total} 条内部记录</Text><Select aria-label="搜索结果排序" value={draft.sort} options={[{ label: '相关度', value: 'relevance' }, { label: '更新时间最新', value: 'updated_desc' }, { label: '更新时间最早', value: 'updated_asc' }]} size="small" onChange={(sort: SearchSort) => void runSearch({ ...draft, sort, page: 1 })} /></div>
        {forcedState ? <StateBlock type={forcedState} onRetry={reset} /> : error ? <StateBlock type="error" onRetry={submit} /> : loading ? <StateBlock type="loading" /> : items.length === 0 ? <StateBlock type="empty" onRetry={reset} /> : <>{items.map((item) => <SearchResultCard item={item} key={`${item.type}-${item.id}`} />)}<Pagination className="result-pagination" current={draft.page} pageSize={draft.page_size} total={total} showSizeChanger={false} onChange={(page) => void runSearch({ ...draft, page })} /></>}
      </div>
    </div>
    <Modal title="保存内部检索" open={saveOpen} onCancel={() => setSaveOpen(false)} onOk={() => void save()} afterOpenChange={(open) => { if (open) saveInput.current?.focus() }} okText="保存" cancelText="取消" confirmLoading={saving} okButtonProps={{ disabled: !saveName.trim() }}>
      <Text type="secondary">保存当前关键词、筛选、排序和分页条件；不会创建外部监控主题。</Text>
      <Input ref={saveInput} className="modal-input" value={saveName} onChange={(event) => setSaveName(event.target.value)} onPressEnter={() => void save()} placeholder="例如：毫米波 VCO 内部检索" aria-label="内部检索名称" />
    </Modal>
  </>
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Text strong>{label}</Text>{children}</div>
}
