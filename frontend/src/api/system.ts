import { adminUsers, dataSources, jobs } from '../mocks'
import type { AdminUserDto, DataSourceStatusDto, JobRecordDto } from '../types'
import { apiRequest, type PageResult } from './client'

export const systemApi = {
  getDataCenter() {
    return apiRequest<{ sources: DataSourceStatusDto[]; jobs: JobRecordDto[] }>('/system/data-center', { method: 'GET' }, () => ({ sources: dataSources, jobs }))
  },
  listUsers() {
    return apiRequest<PageResult<AdminUserDto>>('/admin/users', { method: 'GET' }, () => ({ items: adminUsers, page: 1, page_size: 20, total: adminUsers.length }))
  },
}
