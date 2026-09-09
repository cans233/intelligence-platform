export type ApiResponse<T> = { code: number; data: T; message: string; trace_id: string }

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const authApi = {
  async login(username: string, password: string): Promise<ApiResponse<{ token: string; user: { name: string; role: string } }>> {
    await wait(350)
    if (!username || password.length < 4) throw new Error('请输入用户名和至少 4 位密码')
    return { code: 0, data: { token: 'mock-token', user: { name: username === 'admin' ? '系统管理员' : '研发用户', role: username === 'admin' ? '管理员' : '研发人员' } }, message: 'ok', trace_id: 'mock-login-001' }
  },
}
