import { Tag } from 'antd'
import type { DataCategory, RecordQuality } from '../types'

const qualityMeta: Record<RecordQuality, [string, string]> = {
  VERIFIED: ['已核验', 'green'],
  NORMALIZED: ['已标准化', 'blue'],
  CONFLICT: ['来源冲突', 'red'],
  PENDING: ['待核验', 'orange'],
}

const categoryMeta: Record<DataCategory, [string, string]> = {
  OFFICIAL: ['官方事实', 'green'],
  NORMALIZED: ['系统标准化', 'blue'],
  AI: ['系统 / AI 增强', 'purple'],
  HUMAN: ['人工结论', 'gold'],
}

export function RecordQualityTag({ value }: { value: RecordQuality }) {
  const [label, color] = qualityMeta[value]
  return <Tag color={color}>{label}</Tag>
}

export function DataCategoryTag({ value }: { value: DataCategory }) {
  const [label, color] = categoryMeta[value]
  return <Tag color={color}>{label}</Tag>
}
