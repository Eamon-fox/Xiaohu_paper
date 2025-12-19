const BASE_URL = 'https://fanyiming.life'

function request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      success: (res) => resolve(res.data),
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
  return request({ url: `/api/articles/${id}` })
}

function getArchiveDates(params = {}) {
  return request({ url: '/api/archive/dates', data: params })
}

function getArchiveStats() {
  return request({ url: '/api/archive/stats' })
}

function triggerPipeline() {
  return request({ url: '/api/trigger', method: 'POST' })
}

function getTriggerStatus() {
  return request({ url: '/api/trigger/status' })
}

module.exports = {
  BASE_URL,
  request,
  getDaily,
  getArticle,
  getArchiveDates,
  getArchiveStats,
  triggerPipeline,
  getTriggerStatus
}
