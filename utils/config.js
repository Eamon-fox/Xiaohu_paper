const { authRequest } = require('./auth')

// 获取用户配置（需认证）
function getConfig() {
  return authRequest({ url: '/api/config', method: 'GET' }).then(res => res.data)
}

// 更新 VIP 关键词（需认证）
function updateVipKeywords(vipKeywords) {
  return authRequest({
    url: '/api/config/vip-keywords',
    method: 'PATCH',
    data: vipKeywords,
    header: { 'Content-Type': 'application/json' }
  }).then(res => res.data)
}

// 更新语义锚点（需认证）
function updateSemanticAnchors(anchors) {
  return authRequest({
    url: '/api/config/semantic-anchors',
    method: 'PATCH',
    data: anchors,
    header: { 'Content-Type': 'application/json' }
  }).then(res => res.data)
}

// 重置配置为默认值（需认证）
function resetConfig() {
  return authRequest({ url: '/api/config/reset', method: 'POST' }).then(res => res.data)
}

// 获取当前用户信息（需认证）
function getUserInfo() {
  return authRequest({ url: '/api/auth/me', method: 'GET' }).then(res => res.data)
}

module.exports = {
  getConfig,
  updateVipKeywords,
  updateSemanticAnchors,
  resetConfig,
  getUserInfo
}
