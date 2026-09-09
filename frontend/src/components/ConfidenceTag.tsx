import { Tag } from 'antd'
import type { Confidence } from '../types'

export function ConfidenceTag({ value }: { value: Confidence }) {
  const map: Record<Confidence, [string, string]> = { OFFICIAL: ['已核验', 'green'], NORMALIZED: ['系统标准化', 'blue'], CONFLICT: ['来源冲突', 'red'], PENDING: ['待核验', 'orange'], AI: ['系统增强', 'purple'] }
  const [label, color] = map[value]
  return <Tag color={color}>{label}</Tag>
}
