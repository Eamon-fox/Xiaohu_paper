const { authRequest } = require('./auth')

// 本地缓存 key
const CACHE_KEY = 'bookmarks_cache'

// 获取收藏列表
async function getBookmarks(useCache = false) {
  // 优先使用缓存
  if (useCache) {
    const cached = wx.getStorageSync(CACHE_KEY)
    if (cached) return cached
  }

  const res = await authRequest({
    url: '/api/bookmarks',
    method: 'GET'
  })

  // API 返回 { total, bookmarks: [...] }
  const bookmarks = res.data.bookmarks || []
  // 更新缓存
  wx.setStorageSync(CACHE_KEY, bookmarks)
  return bookmarks
}

// 添加收藏
async function addBookmark(articleId) {
  const res = await authRequest({
    url: `/api/bookmarks/${articleId}`,
    method: 'POST'
  })
  // 清除缓存
  wx.removeStorageSync(CACHE_KEY)
  return res.data
}

// 取消收藏
async function removeBookmark(articleId) {
  const res = await authRequest({
    url: `/api/bookmarks/${articleId}`,
    method: 'DELETE'
  })
  // 清除缓存
  wx.removeStorageSync(CACHE_KEY)
  return res.data
}

// 检查是否已收藏 (使用专门的状态接口)
async function checkBookmarkStatus(articleId) {
  try {
    const res = await authRequest({
      url: `/api/bookmarks/${articleId}/status`,
      method: 'GET'
    })
    return res.data.is_bookmarked
  } catch (err) {
    console.error('检查收藏状态失败', err)
    return false
  }
}

// 清除收藏缓存
function clearBookmarksCache() {
  wx.removeStorageSync(CACHE_KEY)
}

module.exports = {
  getBookmarks,
  addBookmark,
  removeBookmark,
  checkBookmarkStatus,
  clearBookmarksCache
}
