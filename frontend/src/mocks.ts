import type { Patent } from './types'

export const patents: Patent[] = [
  { id: 'cn-001', title: '一种面向毫米波通信的低相噪压控振荡器及校准方法', publication_number: 'CN118765432A', application_number: 'CN202410123456.7', country: 'CN', applicant_names: ['星河微电子（上海）有限公司'], inventor_names: ['李明', '周宁'], publication_date: '2025-02-18', filing_date: '2024-08-16', priority_date: '2024-08-16', ipc_codes: ['H03B 5/12'], cpc_codes: ['H03B5/12'], legal_status: '申请中', abstract: '本发明公开一种面向毫米波通信的低相噪压控振荡器及校准方法，通过分段式谐振网络和数字校准环路提升调谐线性度与温度稳定性。', source_codes: ['CNIPA', 'EPO'], confidence: 'OFFICIAL', hit_reasons: ['标题命中', '权利要求命中', 'IPC命中'], discovery_path: 'Search Profile：毫米波 VCO → IPC 命中 → EPO 发现', relevance: '高', claims: [{ claim_no: 1, claim_type: '独立', text: '一种压控振荡器，包括谐振核心、数字校准环路和温度补偿单元，其特征在于，所述数字校准环路根据目标频段对谐振核心进行分段调谐。' }, { claim_no: 2, claim_type: '从属', text: '根据权利要求1所述的压控振荡器，其中温度补偿单元包括温度传感器和查找表。' }] },
  { id: 'us-002', title: 'Adaptive calibration circuit for millimeter-wave oscillator', publication_number: 'US20250123456A1', application_number: 'US18/765,321', country: 'US', applicant_names: ['Northstar Circuits Inc.'], inventor_names: ['Olivia Chen'], publication_date: '2025-04-03', filing_date: '2024-09-28', priority_date: '2024-09-28', ipc_codes: ['H03B 5/04'], cpc_codes: ['H03B5/04'], legal_status: '申请中', abstract: 'An adaptive calibration circuit dynamically adjusts oscillator segments based on measured phase noise and operating temperature.', source_codes: ['USPTO'], confidence: 'OFFICIAL', hit_reasons: ['摘要命中', '申请人命中'], discovery_path: '关键词：phase noise → USPTO ODP', relevance: '中', claims: [{ claim_no: 1, claim_type: '独立', text: 'An oscillator calibration circuit comprising a sensor, a controller, and a segmented tuning network.' }] },
  { id: 'family-003', title: '多频段射频前端的自适应阻抗匹配网络', publication_number: 'EP4567890A1', application_number: 'EP24201234.5', country: 'EP', applicant_names: ['Aurora RF GmbH'], inventor_names: ['Marta Klein'], publication_date: '2025-01-15', filing_date: '2024-07-11', priority_date: '2024-07-11', ipc_codes: ['H04B 1/40'], cpc_codes: ['H04B1/40'], legal_status: '有效', abstract: '一种适用于多频段射频前端的阻抗匹配网络，在不同工作频段之间快速切换并保持低损耗。', source_codes: ['EPO', 'Google'], confidence: 'NORMALIZED', hit_reasons: ['技术特征命中', '分类号命中'], discovery_path: '专利族扩展 → EPO OPS → Google BigQuery 交叉验证', relevance: '中', claims: [{ claim_no: 1, claim_type: '独立', text: '一种射频前端阻抗匹配网络，包括可切换电容阵列和控制器。' }] },
  { id: 'conflict-004', title: '用于边缘设备的低功耗信号处理装置', publication_number: 'CN117654321A', application_number: 'CN202311234567.2', country: 'CN', applicant_names: ['远山科技有限公司'], inventor_names: ['王磊'], publication_date: '2024-12-20', filing_date: '2023-10-12', priority_date: '2023-10-12', ipc_codes: ['G06F 1/32'], cpc_codes: [], legal_status: '待核验', abstract: '', source_codes: ['CNIPA', 'EPO'], confidence: 'CONFLICT', hit_reasons: ['申请人命中'], discovery_path: '申请人别名匹配 → CNIPA / EPO 字段冲突', relevance: '低', claims: [{ claim_no: 1, claim_type: '独立', text: '一种低功耗信号处理装置，包括处理器、存储器和功耗管理模块。' }] },
]

export const searchPatents = (query: string) => {
  const synonyms: Record<string, string[]> = { vco: ['vco', '压控振荡器'], mmwave: ['mmwave', '毫米波'], 'phase-noise': ['phase-noise', '相噪'] }
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return patents
  return patents.filter((p) => {
    const haystack = [p.title, p.abstract, p.publication_number, ...p.applicant_names, ...p.ipc_codes].join(' ').toLowerCase()
    return terms.every((term) => (synonyms[term] ?? [term]).some((candidate) => haystack.includes(candidate)))
  })
}
