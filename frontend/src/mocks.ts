import type {
  AdminUserDto,
  DataSourceStatusDto,
  DocumentDto,
  InternalSearchQueryDto,
  InternalSearchResultDto,
  JobRecordDto,
  MonitoringProfileDto,
  MonitoringRunDto,
  MockPatentDetail,
  MockPatentListItem,
  MockProjectDetail,
  ReviewItemDto,
  SavedInternalSearch,
  TechnologyDto,
} from './types'

export const technologies: TechnologyDto[] = [
  { id: 'tech-vco', name: '毫米波 VCO', domain: '射频芯片', stage: '重点跟踪', owner: '周宁', description: '面向 24–40 GHz 收发机的低相噪压控振荡器及数字校准技术。', keywords: ['毫米波', 'VCO', '相噪', '校准'], project_ids: ['project-mmwave'], updated_at: '2026-09-08' },
  { id: 'tech-edge-ai', name: '低功耗边缘 AI', domain: '人工智能', stage: '方案评估', owner: '陈悦', description: '在受限功耗下进行本地推理的芯片、压缩和调度方案。', keywords: ['边缘 AI', '低功耗', '推理'], project_ids: ['project-edge-ai'], updated_at: '2026-09-07' },
  { id: 'tech-thermal', name: '功率器件热管理', domain: '功率电子', stage: '知识沉淀', owner: '林涛', description: '功率模块封装、散热结构和热仿真方法。', keywords: ['热管理', '功率器件', '封装'], project_ids: ['project-thermal'], updated_at: '2026-08-29' },
]

export const documents: DocumentDto[] = [
  { id: 'doc-rf-brief', name: '毫米波收发前端技术需求说明书', file_type: 'DOCX', project_id: 'project-mmwave', project_name: '毫米波收发芯片预研', version: 'v1.6', owner: '周宁', updated_at: '2026-09-08 16:20', status: '已解析', summary: '定义收发频段、相噪、输出功率及温漂指标。' },
  { id: 'doc-vco-review', name: 'VCO 专利景观评审纪要', file_type: 'PDF', project_id: 'project-mmwave', project_name: '毫米波收发芯片预研', version: 'v2.1', owner: '李明', updated_at: '2026-09-07 11:05', status: '已解析', summary: '汇总主要申请人、核心专利族与潜在规避方向。' },
  { id: 'doc-edge-matrix', name: '端侧推理方案对比矩阵', file_type: 'XLSX', project_id: 'project-edge-ai', project_name: '低功耗边缘推理平台', version: 'v0.9', owner: '陈悦', updated_at: '2026-09-06 18:42', status: '解析中', summary: '比较芯片平台、算力、功耗和工具链支持情况。' },
  { id: 'doc-thermal-report', name: '功率模块热仿真结题报告', file_type: 'PDF', project_id: 'project-thermal', project_name: '功率器件热管理', version: 'v1.0', owner: '林涛', updated_at: '2026-08-29 09:10', status: '解析失败', summary: '记录散热结构方案和热仿真结果。' },
]

const projectLink = { id: 'project-mmwave', code: 'PRJ-RF-024', name: '毫米波收发芯片预研', relation: '核心技术与专利布局' }

export const patents: MockPatentDetail[] = [
  {
    id: 'cn-001', title: '一种面向毫米波通信的低相噪压控振荡器及校准方法', ownership: 'COMPANY', record_quality: 'VERIFIED', updated_at: '2026-09-08',
    official_facts: { publication_number: 'CN118765432A', application_number: 'CN202410123456.7', country: 'CN', applicant_names: ['星河微电子（上海）有限公司'], inventor_names: ['李明', '周宁'], publication_date: '2025-02-18', filing_date: '2024-08-16', priority_date: '2024-08-16', ipc_codes: ['H03B 5/12'], cpc_codes: ['H03B5/12'], legal_status: '申请中', abstract: '本发明公开一种面向毫米波通信的低相噪压控振荡器及校准方法，通过分段式谐振网络和数字校准环路提升调谐线性度与温度稳定性。', claims: [{ claim_no: 1, claim_type: '独立', text: '一种压控振荡器，包括谐振核心、数字校准环路和温度补偿单元，其特征在于，所述数字校准环路根据目标频段对谐振核心进行分段调谐。' }, { claim_no: 2, claim_type: '从属', text: '根据权利要求1所述的压控振荡器，其中温度补偿单元包括温度传感器和查找表。' }], family_members: [{ id: 'family-cn', country: 'CN', publication_number: 'CN118765432A', publication_date: '2025-02-18', legal_status: '申请中' }, { id: 'family-wo', country: 'WO', publication_number: 'WO2025034567A1', publication_date: '2025-03-06', legal_status: '有效' }], citations: [{ id: 'cite-1', direction: '引用', publication_number: 'CN112345678A', title: '宽带压控振荡器的数字校准电路' }], legal_events: [{ id: 'event-1', date: '2025-02-18', event: '发明专利申请公布', source: 'CNIPA' }, { id: 'event-2', date: '2024-08-16', event: '专利申请受理', source: 'CNIPA' }] },
    normalized_fields: [{ label: '标准化申请人', value: '星河微电子（上海）有限公司', source: ['CNIPA', 'EPO'] }, { label: '统一法律状态', value: '申请中', source: ['CNIPA'] }],
    ai_enhancements: { keywords: ['毫米波', '压控振荡器', '低相噪', '数字校准'], technical_problem: '提升多频段调谐线性度与温度稳定性。', technical_effect: '降低相噪并缩短校准时间。' },
    human_conclusions: { notes: ['建议纳入射频核心专利组合持续跟踪。'], project_links: [projectLink] },
    sources: [{ source: 'CNIPA', source_record_id: 'CN118765432A', fetched_at: '2026-09-07 09:42', status: '已核验' }, { source: 'EPO OPS', source_record_id: 'CN118765432.A', fetched_at: '2026-09-06 18:20', status: '一致' }],
    discovery_path: ['外部监控：毫米波 VCO', 'IPC 检索：H03B 5/12', 'EPO OPS'],
  },
  {
    id: 'us-002', title: 'Adaptive calibration circuit for millimeter-wave oscillator', ownership: 'EXTERNAL', record_quality: 'VERIFIED', updated_at: '2026-09-07',
    official_facts: { publication_number: 'US20250123456A1', application_number: 'US18/765,321', country: 'US', applicant_names: ['Northstar Circuits Inc.'], inventor_names: ['Olivia Chen'], publication_date: '2025-04-03', filing_date: '2024-09-28', priority_date: '2024-09-28', ipc_codes: ['H03B 5/04'], cpc_codes: ['H03B5/04'], legal_status: '申请中', abstract: 'An adaptive calibration circuit dynamically adjusts oscillator segments based on measured phase noise and operating temperature.', claims: [{ claim_no: 1, claim_type: '独立', text: 'An oscillator calibration circuit comprising a sensor, a controller, and a segmented tuning network.' }], family_members: [], citations: [], legal_events: [{ id: 'event-us-1', date: '2025-04-03', event: 'Published application', source: 'USPTO' }] },
    normalized_fields: [{ label: '标准化申请人', value: 'Northstar Circuits Inc.', source: ['USPTO'] }], ai_enhancements: { keywords: ['VCO', 'phase noise', 'calibration'], technical_problem: '降低温漂对振荡器性能的影响。', technical_effect: '按测量结果动态调整调谐分段。' }, human_conclusions: { notes: ['与公司 VCO 校准方向具有中等相关性。'], project_links: [projectLink] }, sources: [{ source: 'USPTO ODP', source_record_id: 'US20250123456A1', fetched_at: '2026-09-06 10:12', status: '已核验' }], discovery_path: ['外部监控：毫米波 VCO', '关键词检索：phase noise calibration', 'USPTO ODP'],
  },
  {
    id: 'family-003', title: '多频段射频前端的自适应阻抗匹配网络', ownership: 'EXTERNAL', record_quality: 'NORMALIZED', updated_at: '2026-09-05',
    official_facts: { publication_number: 'EP4567890A1', application_number: 'EP24201234.5', country: 'EP', applicant_names: ['Aurora RF GmbH'], inventor_names: ['Marta Klein'], publication_date: '2025-01-15', filing_date: '2024-07-11', priority_date: '2024-07-11', ipc_codes: ['H04B 1/40'], cpc_codes: ['H04B1/40'], legal_status: '有效', abstract: '一种适用于多频段射频前端的阻抗匹配网络，在不同工作频段之间快速切换并保持低损耗。', claims: [{ claim_no: 1, claim_type: '独立', text: '一种射频前端阻抗匹配网络，包括可切换电容阵列和控制器。' }], family_members: [], citations: [], legal_events: [] }, normalized_fields: [{ label: '标准化标题', value: '多频段射频前端的自适应阻抗匹配网络', source: ['EPO OPS'] }], ai_enhancements: { keywords: ['射频前端', '阻抗匹配'], technical_problem: '多频段切换时兼顾损耗和匹配范围。', technical_effect: '提高频段切换效率。' }, human_conclusions: { notes: ['作为外部相关专利持续观察。'], project_links: [projectLink] }, sources: [{ source: 'EPO OPS', source_record_id: 'EP4567890A1', fetched_at: '2026-09-05 14:30', status: '已标准化' }], discovery_path: ['专利族扩展', 'CPC 检索：H04B1/40', 'EPO OPS'],
  },
  {
    id: 'conflict-004', title: '用于边缘设备的低功耗信号处理装置', ownership: 'EXTERNAL', record_quality: 'CONFLICT', updated_at: '2026-09-04',
    official_facts: { publication_number: 'CN117654321A', application_number: 'CN202311234567.2', country: 'CN', applicant_names: ['远山科技有限公司'], inventor_names: ['王磊'], publication_date: '2024-12-20', filing_date: '2023-10-12', priority_date: '2023-10-12', ipc_codes: ['G06F 1/32'], cpc_codes: [], legal_status: '待核验', abstract: '', claims: [{ claim_no: 1, claim_type: '独立', text: '一种低功耗信号处理装置，包括处理器、存储器和功耗管理模块。' }], family_members: [], citations: [], legal_events: [] }, normalized_fields: [{ label: '申请人字段', value: 'CNIPA 与 EPO 记录不一致', source: ['CNIPA', 'EPO OPS'] }], ai_enhancements: { keywords: ['边缘设备', '低功耗'], technical_problem: '降低边缘信号处理功耗。', technical_effect: '按负载切换功耗状态。' }, human_conclusions: { notes: [], project_links: [{ id: 'project-edge-ai', code: 'PRJ-AI-017', name: '低功耗边缘推理平台', relation: '候选相关专利' }] }, sources: [{ source: 'CNIPA', source_record_id: 'CN117654321A', fetched_at: '2026-09-04 10:20', status: '字段冲突' }, { source: 'EPO OPS', source_record_id: 'CN117654321.A', fetched_at: '2026-09-04 10:24', status: '字段冲突' }], discovery_path: ['外部监控：边缘 AI 芯片低功耗', '申请人别名匹配', 'CNIPA / EPO OPS'],
  },
]

export const patentListItems = patents.map((patent): MockPatentListItem => ({
  id: patent.id, title: patent.title, publication_number: patent.official_facts.publication_number, application_number: patent.official_facts.application_number, country: patent.official_facts.country, applicant: patent.official_facts.applicant_names[0], applicant_names: patent.official_facts.applicant_names, publication_date: patent.official_facts.publication_date, ipc_codes: patent.official_facts.ipc_codes, cpc_codes: patent.official_facts.cpc_codes, legal_status: patent.official_facts.legal_status, status: patent.record_quality, source_codes: patent.sources.map((item) => item.source), updated_at: patent.updated_at, record_quality: patent.record_quality, ownership: patent.ownership,
}))

const relation = (id: string, relevance: '高' | '中' | '低', relation_reason: string) => ({ ...patentListItems.find((item) => item.id === id)!, relevance, relation_reason })

export const projects: MockProjectDetail[] = [
  { id: 'project-mmwave', code: 'PRJ-RF-024', name: '毫米波收发芯片预研', organization: '研发中心', department: '射频集成电路部', owner: '周宁', stage: '原型验证', status: '进行中', updated_at: '2026-09-08', description: '围绕 24–40 GHz 收发前端开展 VCO、功放和自校准技术预研，沉淀可复用的专利证据与内部方案。', technologies: technologies.filter((item) => item.project_ids.includes('project-mmwave')), documents: documents.filter((item) => item.project_id === 'project-mmwave'), company_patents: [relation('cn-001', '高', '公司自有申请，覆盖项目核心数字校准方案')], external_related_patents: [relation('us-002', '中', '校准环路和温度补偿方向相近'), relation('family-003', '中', '同属多频段射频前端技术链')], member_count: 8, risk: '中' },
  { id: 'project-edge-ai', code: 'PRJ-AI-017', name: '低功耗边缘推理平台', organization: '研发中心', department: '边缘计算部', owner: '陈悦', stage: '方案评审', status: '观察中', updated_at: '2026-09-07', description: '评估端侧推理芯片的功耗管理、模型压缩与信号处理方案。', technologies: technologies.filter((item) => item.project_ids.includes('project-edge-ai')), documents: documents.filter((item) => item.project_id === 'project-edge-ai'), company_patents: [], external_related_patents: [relation('conflict-004', '中', '低功耗信号处理方向相关，来源字段待审核')], member_count: 5, risk: '高' },
  { id: 'project-thermal', code: 'PRJ-PWR-011', name: '功率器件热管理', organization: '工程技术中心', department: '功率电子部', owner: '林涛', stage: '结题归档', status: '已归档', updated_at: '2026-08-29', description: '整理功率模块散热结构、封装材料及热仿真结论。', technologies: technologies.filter((item) => item.project_ids.includes('project-thermal')), documents: documents.filter((item) => item.project_id === 'project-thermal'), company_patents: [], external_related_patents: [], member_count: 4, risk: '低' },
]

export const monitoringProfiles: MonitoringProfileDto[] = [
  { id: 'MON-08', name: '毫米波 VCO 全球专利监控', status: 'ACTIVE', query: '毫米波 VCO OR low phase noise oscillator', countries: ['CN', 'US', 'EP', 'WO'], sources: ['CNIPA', 'EPO OPS', 'USPTO ODP'], schedule: '每周一 08:00', last_run_at: '2026-09-07 08:04', next_run_at: '2026-09-14 08:00', candidate_count: 46, new_record_count: 28, duplicate_count: 16, failure_count: 2 },
  { id: 'MON-05', name: '功率器件热管理外部专利监控', status: 'ACTIVE', query: 'power module thermal management', countries: ['CN', 'JP', 'US'], sources: ['CNIPA', 'EPO OPS'], schedule: '每两周周一 09:00', last_run_at: '2026-09-01 09:16', next_run_at: '2026-09-15 09:00', candidate_count: 31, new_record_count: 17, duplicate_count: 14, failure_count: 0 },
  { id: 'MON-02', name: '边缘 AI 芯片低功耗专利监控', status: 'PAUSED', query: 'edge AI low power', countries: ['CN', 'US'], sources: ['CNIPA', 'USPTO ODP'], schedule: '已暂停', last_run_at: '2026-08-26 11:40', next_run_at: '—', candidate_count: 18, new_record_count: 11, duplicate_count: 6, failure_count: 1 },
]

export const monitoringRuns: Record<string, MonitoringRunDto[]> = {
  'MON-08': [{ id: 'RUN-0803', profile_id: 'MON-08', status: 'SUCCEEDED', started_at: '2026-09-07 08:00', finished_at: '2026-09-07 08:04', candidate_count: 46, new_record_count: 28, duplicate_count: 16, failure_count: 2 }],
  'MON-05': [{ id: 'RUN-0502', profile_id: 'MON-05', status: 'SUCCEEDED', started_at: '2026-09-01 09:00', finished_at: '2026-09-01 09:16', candidate_count: 31, new_record_count: 17, duplicate_count: 14, failure_count: 0 }],
  'MON-02': [{ id: 'RUN-0204', profile_id: 'MON-02', status: 'FAILED', started_at: '2026-08-26 11:30', finished_at: '2026-08-26 11:40', candidate_count: 18, new_record_count: 11, duplicate_count: 6, failure_count: 1 }],
}

export const savedInternalSearches: SavedInternalSearch[] = []
export const reviewItems: ReviewItemDto[] = [{ id: 'REV-001', type: '来源字段冲突', target: 'CN117654321A', detail: '申请人名称在 CNIPA 与 EPO OPS 不一致', priority: '高', owner: '未分配', status: '待处理', created_at: '2026-09-09 10:18' }, { id: 'REV-002', type: '技术特征待核验', target: 'CN118765432A', detail: '系统增强生成 3 条候选技术特征', priority: '中', owner: '李明', status: '处理中', created_at: '2026-09-08 16:05' }]
export const dataSources: DataSourceStatusDto[] = [{ code: 'CNIPA', label: '中国国家知识产权局', status: '正常', last_sync_at: '2026-09-09 10:30', success_rate: 100 }, { code: 'EPO', label: 'EPO OPS', status: '正常', last_sync_at: '2026-09-09 10:18', success_rate: 99 }, { code: 'USPTO', label: 'USPTO ODP', status: '限流', last_sync_at: '2026-09-08 18:42', success_rate: 62 }]
export const jobs: JobRecordDto[] = [{ id: 'JOB-2031', type: '外部监控执行', source: 'EPO OPS', status: '成功', started_at: '2026-09-09 08:00', summary: '新增 28 件，重复 16 件' }, { id: 'JOB-2028', type: '文档解析', source: '内部文档', status: '失败', started_at: '2026-09-08 17:40', summary: 'DOCX 内容解析失败，等待处理' }]
export const adminUsers: AdminUserDto[] = [{ id: 'USR-001', name: '系统管理员', role: '管理员', data_scope: '全部数据', status: '启用' }, { id: 'USR-024', name: '周宁', role: '研发负责人', data_scope: '射频芯片项目', status: '启用' }, { id: 'USR-017', name: '陈悦', role: '研发人员', data_scope: '边缘 AI 项目', status: '启用' }]

const terms = (value: string) => value.trim().toLowerCase().split(/\s+/).filter(Boolean)
const matchesAll = (text: string, keyword: string) => terms(keyword).every((term) => text.toLowerCase().includes(term))

const segments = (text: string, keyword: string) => {
  const values = terms(keyword)
  if (!values.length) return [{ text, highlighted: false }]
  const escaped = values.map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(${escaped.join('|')})`, 'ig')
  return text.split(pattern).filter(Boolean).map((part) => ({ text: part, highlighted: values.includes(part.toLowerCase()) }))
}

export function searchAll(query: InternalSearchQueryDto): InternalSearchResultDto[] {
  const items: InternalSearchResultDto[] = [
    ...patents.map((patent) => ({ id: patent.id, type: 'patent' as const, title: patent.title, snippet: patent.official_facts.abstract || '暂无官方摘要', highlights: [{ field: 'title', segments: segments(patent.title, query.keyword) }, { field: 'snippet', segments: segments(patent.official_facts.abstract || '暂无官方摘要', query.keyword) }], hit_reasons: ['标题命中', '权利要求命中', 'IPC 命中'], source: patent.sources.map((item) => item.source), updated_at: patent.updated_at, publication_number: patent.official_facts.publication_number, applicant: patent.official_facts.applicant_names[0], publication_date: patent.official_facts.publication_date, ipc_codes: patent.official_facts.ipc_codes, cpc_codes: patent.official_facts.cpc_codes })),
    ...projects.map((project) => ({ id: project.id, type: 'project' as const, title: project.name, snippet: project.description, highlights: [{ field: 'title', segments: segments(project.name, query.keyword) }, { field: 'snippet', segments: segments(project.description, query.keyword) }], hit_reasons: ['项目名称命中', '技术标签命中'], source: ['内部项目库'], updated_at: project.updated_at })),
    ...technologies.map((technology) => ({ id: technology.id, type: 'technology' as const, title: technology.name, snippet: technology.description, highlights: [{ field: 'title', segments: segments(technology.name, query.keyword) }, { field: 'snippet', segments: segments(technology.description, query.keyword) }], hit_reasons: ['技术主题命中', '关键词命中'], source: ['内部技术库'], updated_at: technology.updated_at })),
    ...documents.map((document) => ({ id: document.id, type: 'document' as const, title: document.name, snippet: document.summary, highlights: [{ field: 'title', segments: segments(document.name, query.keyword) }, { field: 'snippet', segments: segments(document.summary, query.keyword) }], hit_reasons: ['文档标题命中', '项目名称命中'], source: ['内部文档库'], updated_at: document.updated_at })),
  ]

  const filtered = items.filter((item) => {
    if (!query.types.includes(item.type)) return false
    if (query.keyword && !matchesAll([item.title, item.snippet, item.applicant, item.publication_number, ...(item.ipc_codes ?? []), ...(item.cpc_codes ?? [])].filter(Boolean).join(' '), query.keyword)) return false
    if (query.date_from && item.updated_at.slice(0, 10) < query.date_from) return false
    if (query.date_to && item.updated_at.slice(0, 10) > query.date_to) return false
    if (query.applicant && item.type !== 'patent') return false
    if (query.applicant && !item.applicant?.toLowerCase().includes(query.applicant.toLowerCase())) return false
    if (query.ipc_codes.length && !query.ipc_codes.some((code) => item.ipc_codes?.some((value) => value.includes(code)))) return false
    if (query.cpc_codes.length && !query.cpc_codes.some((code) => item.cpc_codes?.some((value) => value.includes(code)))) return false
    if (query.countries.length && !query.countries.includes(patents.find((patent) => patent.id === item.id)?.official_facts.country ?? '')) return false
    if (query.project_ids.length) {
      const linked = item.type === 'project' ? [item.id] : item.type === 'document' ? [documents.find((document) => document.id === item.id)?.project_id] : item.type === 'technology' ? technologies.find((technology) => technology.id === item.id)?.project_ids : patents.find((patent) => patent.id === item.id)?.human_conclusions.project_links.map((project) => project.id)
      if (!query.project_ids.some((id) => linked?.includes(id))) return false
    }
    if (query.technology_tags.length) {
      const searchable = [item.title, item.snippet, ...(item.ipc_codes ?? []), ...(item.cpc_codes ?? [])].join(' ').toLowerCase()
      if (!query.technology_tags.every((tag) => searchable.includes(tag.toLowerCase()))) return false
    }
    return true
  })

  if (query.sort === 'updated_desc') return filtered.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  if (query.sort === 'updated_asc') return filtered.sort((a, b) => a.updated_at.localeCompare(b.updated_at))
  return filtered
}
