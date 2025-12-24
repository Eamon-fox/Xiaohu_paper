const { getBookmarks, removeBookmark, clearBookmarksCache } = require('../../utils/bookmark')
const app = getApp()

Page({
  data: {
    bookmarks: [],
    loading: true,
    isEmpty: false
  },

  onShow() {
    this.loadBookmarks()
  },

  async loadBookmarks() {
    this.setData({ loading: true })
    try {
      clearBookmarksCache()
      const bookmarks = await getBookmarks()

      this.setData({
        bookmarks: bookmarks,
        loading: false,
        isEmpty: bookmarks.length === 0
      })
    } catch (err) {
      console.error('加载收藏失败', err)
      this.setData({ loading: false, isEmpty: true })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  onTapArticle(e) {
    const id = e.currentTarget.dataset.id
    app.globalData.currentArticles = this.data.bookmarks.map(a => a.article_id)
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  async onRemoveBookmark(e) {
    const id = e.currentTarget.dataset.id
    const index = e.currentTarget.dataset.index

    wx.showModal({
      title: '确认取消收藏',
      content: '确定要取消收藏这篇文章吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await removeBookmark(id)
            const bookmarks = this.data.bookmarks.filter((_, i) => i !== index)
            this.setData({
              bookmarks,
              isEmpty: bookmarks.length === 0
            })
            wx.showToast({ title: '已取消收藏', icon: 'none' })
          } catch (err) {
            wx.showToast({ title: '操作失败', icon: 'none' })
          }
        }
      }
    })
  },

  onPullDownRefresh() {
    this.loadBookmarks().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
