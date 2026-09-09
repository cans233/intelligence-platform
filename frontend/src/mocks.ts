import type { KnowledgeDocument, Patent, Project, SearchResult, Technology } from './types'

export const patents: Patent[] = [
  { id: 'cn-001', title: '一种面向毫米波通信的低相噪压控振荡器及校准方法', publication_number: 'CN118765432A', application_number: 'CN202410123456.7', country: 'CN', applicant_names: ['星河微电子（上海）有限公司'], inventor_names: ['李明', '周宁'], publication_date: '2025-02-18', filing_date: '2024-08-16', priority_date: '2024-08-16', ipc_codes: ['H03B 5/12'], cpc_codes: ['H03B5/12'], legal_status: '申请中', abstract: '本发明公开一种面向毫米波通信的低相噪压控振荡器及校准方法，通过分段式谐振网络和数字校准环路提升调谐线性度与温度稳定性。', source_codes: ['CNIPA', 'EPO'], confidence: 'OFFICIAL', hit_reasons: ['标题命中', '权利要求命中', 'IPC 命中'], discovery_path: '内部检索：毫米波 VCO → IPC 命中 → EPO 发现', relevance: '高', claims: [{ claim_no: 1, claim_type: '独立', text: '一种压控振荡器，包括谐振核心、数字校准环路和温度补偿单元，其特征在于，所述数字校准环路根据目标频段对谐振核心进行分段调谐。' }, { claim_no: 2, claim_type: '从属', text: '根据权利要求1所述的压控振荡器，其中温度补偿单元包括温度传感器和查找表。' }] },
  { id: 'us-002', title: 'Adaptive calibration circuit for millimeter-wave oscillator', publication_number: 'US20250123456A1', application_number: 'US18/765,321', country: 'US', applicant_names: ['Northstar Circuits Inc.'], inventor_names: ['Olivia Chen'], publication_date: '2025-04-03', filing_date: '2024-09-28', priority_date: '2024-09-28', ipc_codes: ['H03B 5/04'], cpc_codes: ['H03B5/04'], legal_status: '申请中', abstract: 'An adaptive calibration circuit dynamically adjusts oscillator segments based on measured phase noise and operating temperature.', source_codes: ['USPTO'], confidence: 'OFFICIAL', hit_reasons: ['摘要命中', '申请人命中'], discovery_path: '内部检索：phase noise → USPTO ODP', relevance: '中', claims: [{ claim_no: 1, claim_type: '独立', text: 'An oscillator calibration circuit comprising a sensor, a controller, and a segmented tuning network.' }] },
  { id: 'family-003', title: '多频段射频前端的自适应阻抗匹配网络', publication_number: 'EP4567890A1', application_number: 'EP24201234.5', country: 'EP', applicant_names: ['Aurora RF GmbH'], inventor_names: ['Marta Klein'], publication_date: '2025-01-15', filing_date: '2024-07-11', priority_date: '2024-07-11', ipc_codes: ['H04B 1/40'], cpc_codes: ['H04B1/40'], legal_status: '有效', abstract: '一种适用于多频段射频前端的阻抗匹配网络，在不同工作频段之间快速切换并保持低损耗。', source_codes: ['EPO', 'Google'], confidence: 'NORMALIZED', hit_reasons: ['技术特征命中', '分类号命中'], discovery_path: '专利族扩展 → EPO OPS → Google BigQuery 交叉验证', relevance: '中', claims: [{ claim_no: 1, claim_type: '独立', text: '一种射频前端阻抗匹配网络，包括可切换电容阵列和控制器。' }] },
  { id: 'conflict-004', title: '用于边缘设备的低功耗信号处理装置', publication_number: 'CN117654321A', application_number: 'CN202311234567.2', country: 'CN', applicant_names: ['远山科技有限公司'], inventor_names: ['王磊'], publication_date: '2024-12-20', filing_date: '2023-10-12', priority_date: '2023-10-12', ipc_codes: ['G06F 1/32'], cpc_codes: [], legal_status: '待核验', abstract: '', source_codes: ['CNIPA', 'EPO'], confidence: 'CONFLICT', hit_reasons: ['申请人命中'], discovery_path: '申请人别名匹配 → CNIPA / EPO 字段冲突', relevance: '低', claims: [{ claim_no: 1, claim_type: '独立', text: '一种低功耗信号处理装置，包括处理器、存储器和功耗管理模块。' }] },
]

export const projects: Project[] = [
  { id: 'project-mmwave', code: 'PRJ-RF-024', name: '毫米波收发芯片预研', owner: '周宁', stage: '原型验证', status: '进行中', updated_at: '2026-09-08', description: '围绕 24–40 GHz 收发前端开展 VCO、功放和自校准技术预研，沉淀可复用的专利证据与内部方案。', technologies: ['毫米波 VCO', '自适应校准', '射频前端'], patent_ids: ['cn-001', 'us-002', 'family-003'], document_ids: ['doc-rf-brief', 'doc-vco-review'], member_count: 8, risk: '中' },
  { id: 'project-edge-ai', code: 'PRJ-AI-017', name: '低功耗边缘推理平台', owner: '陈悦', stage: '方案评审', status: '观察中', updated_at: '2026-09-07', description: '评估端侧推理芯片的功耗管理、模型压缩与信号处理方案。', technologies: ['边缘 AI', '低功耗', '模型压缩'], patent_ids: ['conflict-004'], document_ids: ['doc-edge-matrix'], member_count: 5, risk: '高' },
  { id: 'project-thermal', code: 'PRJ-PWR-011', name: '功率器件热管理', owner: '林涛', stage: '结题归档', status: '已归档', updated_at: '2026-08-29', description: '整理功率模块散热结构、封装材料及热仿真结论。', technologies: ['热管理', '功率器件'], patent_ids: [], document_ids: ['doc-thermal-report'], member_count: 4, risk: '低' },
]

export const documents: KnowledgeDocument[] = [
  { id: 'doc-rf-brief', name: '毫米波收发前端技术需求说明书', file_type: 'DOCX', project_id: 'project-mmwave', project_name: '毫米波收发芯片预研', version: 'v1.6', owner: '周宁', updated_at: '2026-09-08 16:20', status: '已解析', summary: '定义收发频段、相噪、输出功率及温漂指标。' },
  { id: 'doc-vco-review', name: 'VCO 专利景观评审纪要', file_type: 'PDF', project_id: 'project-mmwave', project_name: '毫米波收发芯片预研', version: 'v2.1', owner: '李明', updated_at: '2026-09-07 11:05', status: '已解析', summary: '汇总主要申请人、核心专利族与潜在规避方向。' },
  { id: 'doc-edge-matrix', name: '端侧推理方案对比矩阵', file_type: 'XLSX', project_id: 'project-edge-ai', project_name: '低功耗边缘推理平台', version: 'v0.9', owner: '陈悦', updated_at: '2026-09-06 18:42', status: '解析中', summary: '比较芯片平台、算力、功耗和工具链支持情况。' },
  { id: 'doc-thermal-report', name: '功率模块热仿真结题报告', file_type: 'PDF', project_id: 'project-thermal', project_name: '功率器件热管理', version: 'v1.0', owner: '林涛', updated_at: '2026-08-29 09:10', status: '解析失败', summary: '记录散热结构方案和热仿真结果。' },
]

export const technologies: Technology[] = [
  { id: 'tech-vco', name: '毫米波 VCO', domain: '射频芯片', stage: '重点跟踪', owner: '周宁', description: '面向 24–40 GHz 收发机的低相噪压控振荡器及数字校准技术。', keywords: ['毫米波', 'VCO', '相噪', '校准'], updated_at: '2026-09-08' },
  { id: 'tech-edge-ai', name: '低功耗边缘 AI', domain: '人工智能', stage: '方案评估', owner: '陈悦', description: '在受限功耗下进行本地推理的芯片、压缩和调度方案。', keywords: ['边缘 AI', '低功耗', '推理'], updated_at: '2026-09-07' },
  { id: 'tech-thermal', name: '功率器件热管理', domain: '功率电子', stage: '知识沉淀', owner: '林涛', description: '功率模块封装、散热结构和热仿真方法。', keywords: ['热管理', '功率器件', '封装'], updated_at: '2026-08-29' },
]

const includesAll = (text: string, terms: string[]) => terms.every((term) => text.toLowerCase().includes(term))

export const searchPatents = (query: string) => {
  const synonyms: Record<string, string[]> = { vco: ['vco', '压控振荡器'], mmwave: ['mmwave', '毫米波'], 'phase-noise': ['phase-noise', '相噪'] }
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return patents
  return patents.filter((patent) => {
    const text = [patent.title, patent.abstract, patent.publication_number, ...patent.applicant_names, ...patent.ipc_codes].join(' ').toLowerCase()
    return terms.every((term) => (synonyms[term] ?? [term]).some((candidate) => text.includes(candidate)))
  })
}

export const searchAll = (query: string): SearchResult[] => {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const results: SearchResult[] = [
    ...patents.map((patent) => ({ id: patent.id, kind: 'patent' as const, title: patent.title, subtitle: `${patent.publication_number} · ${patent.applicant_names[0]}`, excerpt: patent.abstract || '暂无官方摘要', href: `/patents/${patent.id}`, updated_at: patent.publication_date, tags: [patent.country, ...patent.ipc_codes], hit_reasons: patent.hit_reasons, confidence: patent.confidence, discovery_path: patent.discovery_path })),
    ...projects.map((project) => ({ id: project.id, kind: 'project' as const, title: project.name, subtitle: `${project.code} · ${project.owner}负责`, excerpt: project.description, href: `/projects/${project.id}`, updated_at: project.updated_at, tags: [project.stage, ...project.technologies], hit_reasons: ['项目名称命中', '技术标签命中'] })),
    ...technologies.map((technology) => ({ id: technology.id, kind: 'technology' as const, title: technology.name, subtitle: `${technology.domain} · ${technology.owner}负责`, excerpt: technology.description, href: `/technologies#${technology.id}`, updated_at: technology.updated_at, tags: [technology.stage, ...technology.keywords], hit_reasons: ['技术主题命中', '关键词命中'] })),
    ...documents.map((document) => ({ id: document.id, kind: 'document' as const, title: document.name, subtitle: `${document.file_type} · ${document.project_name}`, excerpt: document.summary, href: `/documents#${document.id}`, updated_at: document.updated_at, tags: [document.version, document.status], hit_reasons: ['文档标题命中', '项目名称命中'] })),
  ]
  if (!terms.length) return results
  return results.filter((item) => includesAll([item.title, item.subtitle, item.excerpt, ...item.tags].join(' '), terms))
}
