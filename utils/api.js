const BASE_URL = 'https://fanyiming.life'

function request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject({ statusCode: res.statusCode, data: res.data })
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络错误', icon: 'none' })
        reject(err)
      }
    })
  })
}

function getDaily(date, version) {
  const params = {}
  if (date) params.date = date
  if (version) params.version = version
  return request({ url: '/api/daily', data: params })
}

function getArticle(id) {
  const { authRequest } = require('./auth')
  return authRequest({ url: `/api/articles/${id}` }).then(res => res.data)
}

function getArchiveDates(params = {}) {
  return request({ url: '/api/archive/dates', data: params })
}

function getArchiveStats() {
  return request({ url: '/api/archive/stats' })
}

// ========== 个性化日报 API /api/my/* ==========

// 获取我的个性化日报
// 返回: { statusCode: 200|202|404, data: {...} }
function getMyDaily(date) {
  const { authRequest } = require('./auth')
  const params = date ? { date } : {}
  return authRequest({ url: '/api/my/daily', method: 'GET', data: params })
}

// 触发生成/重新生成我的日报
// 返回: { task_id, message }
function regenerateMyDaily() {
  const { authRequest } = require('./auth')
  return authRequest({ url: '/api/my/daily/regenerate', method: 'POST' })
    .then(res => res.data)
}

// 查询任务状态
// 返回: { task_id, status, created_at, started_at, finished_at, error }
// status: pending | running | done | failed
function getMyDailyTask(taskId) {
  const { authRequest } = require('./auth')
  const url = taskId ? `/api/my/daily/task/${taskId}` : '/api/my/daily/task'
  return authRequest({ url, method: 'GET' }).then(res => res.data)
}

// 标记文章已读
function markAsRead(articleId, date) {
  const { authRequest } = require('./auth')
  const params = date ? { date } : {}
  return authRequest({
    url: `/api/my/read/${articleId}`,
    method: 'POST',
    data: params
  }).then(res => res.data)
}

// 获取我的历史日报列表
function getMyHistory(limit = 30) {
  const { authRequest } = require('./auth')
  return authRequest({
    url: '/api/my/history',
    method: 'GET',
    data: { limit }
  }).then(res => res.data)
}

// 清空已读记录
function clearReadHistory() {
  const { authRequest } = require('./auth')
  return authRequest({
    url: '/api/my/seen',
    method: 'DELETE'
  }).then(res => res.data)
}

module.exports = {
  BASE_URL,
  request,
  getDaily,
  getArticle,
  getArchiveDates,
  getArchiveStats,
  // 个性化日报 API
  getMyDaily,
  regenerateMyDaily,
  getMyDailyTask,
  markAsRead,
  getMyHistory,
  clearReadHistory
}
