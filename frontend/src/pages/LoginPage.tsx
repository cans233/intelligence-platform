import { CloudServerOutlined, RightOutlined, TeamOutlined } from '@ant-design/icons'
import { Button, Checkbox, Form, Input, Typography, message } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/client'

const { Paragraph, Text, Title } = Typography

export function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const submit = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const response = await authApi.login(values.username, values.password)
      localStorage.setItem('mock-token', response.data.token)
      onSuccess()
      navigate('/dashboard')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return <div className="login-page">
    <div className="login-rail">
      <div className="brand-mark">知脉<span>·</span></div>
      <Text className="rail-kicker">TECH INTELLIGENCE / 01</Text>
      <Title>把每一次检索，<br /><em>变成可追溯的判断。</em></Title>
      <Paragraph>公司技术知识与专利情报系统，让研发、知识产权和管理团队在同一条证据链上协作。</Paragraph>
      <div className="rail-foot"><span className="status-dot" />Contract Mock · B Phase 2</div>
    </div>
    <div className="login-panel"><div className="login-inner">
      <Text className="eyebrow">欢迎回来</Text>
      <Title level={2}>登录系统</Title>
      <Text type="secondary">使用内部账号访问技术知识工作台</Text>
      <Form form={form} layout="vertical" onFinish={submit} className="login-form" initialValues={{ username: 'admin', password: '1234' }}>
        <Form.Item name="username" label="用户名或邮箱" rules={[{ required: true, message: '请输入用户名或邮箱' }]}><Input size="large" placeholder="例如：admin" prefix={<TeamOutlined />} /></Form.Item>
        <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}><Input.Password size="large" placeholder="请输入密码" /></Form.Item>
        <div className="form-row"><Checkbox>保持登录状态</Checkbox><a href="#help">登录遇到问题？</a></div>
        <Button type="primary" htmlType="submit" size="large" block loading={loading}>进入工作台 <RightOutlined /></Button>
      </Form>
      <div className="login-note"><CloudServerOutlined /> 当前为 Mock 数据环境，所有数据仅用于界面演示</div>
    </div></div>
  </div>
}
