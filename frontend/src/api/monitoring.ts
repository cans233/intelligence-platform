import { monitoringProfiles, monitoringRuns } from '../mocks'
import type { CreateMonitoringProfileDto, MonitoringProfileDto, MonitoringRunDto } from '../types'
import { apiRequest, type PageResult } from './client'

export const monitoringApi = {
  listProfiles() {
    return apiRequest<PageResult<MonitoringProfileDto>>('/monitoring/profiles', { method: 'GET' }, () => ({ items: monitoringProfiles, page: 1, page_size: 20, total: monitoringProfiles.length }))
  },
  createProfile(input: CreateMonitoringProfileDto) {
    return apiRequest<MonitoringProfileDto>('/monitoring/profiles', { method: 'POST', body: JSON.stringify(input) }, () => {
      const profile = { ...input, id: `MON-${String(monitoringProfiles.length + 1).padStart(2, '0')}`, status: 'ACTIVE' as const, last_run_at: '尚未运行', next_run_at: '按新计划执行', candidate_count: 0, new_record_count: 0, duplicate_count: 0, failure_count: 0 }
      monitoringProfiles.push(profile)
      monitoringRuns[profile.id] = []
      return profile
    })
  },
  listRuns(profileId: string) {
    return apiRequest<PageResult<MonitoringRunDto>>(`/monitoring/profiles/${encodeURIComponent(profileId)}/runs`, { method: 'GET' }, () => {
      const items = monitoringRuns[profileId] ?? []
      return { items, page: 1, page_size: 20, total: items.length }
    })
  },
  runNow(profileId: string) {
    return apiRequest<MonitoringRunDto>(`/monitoring/profiles/${encodeURIComponent(profileId)}/run`, { method: 'POST' }, () => {
      const profile = monitoringProfiles.find((item) => item.id === profileId)
      if (!profile) throw new Error('MONITORING_PROFILE_NOT_FOUND')
      profile.status = 'RUNNING'
      const run: MonitoringRunDto = { id: `RUN-${Date.now()}`, profile_id: profileId, status: 'RUNNING', started_at: new Date().toISOString(), candidate_count: 0, new_record_count: 0, duplicate_count: 0, failure_count: 0 }
      monitoringRuns[profileId] = [run, ...(monitoringRuns[profileId] ?? [])]
      return run
    })
  },
}
