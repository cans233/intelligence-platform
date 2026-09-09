import type { ReactNode } from 'react'
import { Typography } from 'antd'

const { Text, Title } = Typography

export function PageHeader({ eyebrow, title, description, extra }: { eyebrow: string; title: string; description?: string; extra?: ReactNode }) {
  return <div className="page-header"><div><Text className="eyebrow">{eyebrow}</Text><Title>{title}</Title>{description && <Text type="secondary">{description}</Text>}</div>{extra && <div className="page-header-extra">{extra}</div>}</div>
}
