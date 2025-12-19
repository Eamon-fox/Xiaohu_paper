const api = require('../../utils/api')
const { addBookmark, removeBookmark, checkBookmarkStatus } = require('../../utils/bookmark')

Page({
  data: {
    article: null,
    loading: true,
    showOriginal: false,
    isBookmarked: false,
    bookmarkLoading: false
  },

  onLoad(options) {
    this.articleId = options.id
    this.fetchArticle(options.id)
    this.checkBookmark(options.id)
  },

  fetchArticle(id) {
    api.getArticle(id).then(res => {
      this.setData({ article: res, loading: false })
    }).catch(() => {
      this.setData({ loading: false })
      wx.showToast({ title: '文章不存在', icon: 'none' })
    })
  },

  async checkBookmark(id) {
    const bookmarked = await checkBookmarkStatus(id)
    this.setData({ isBookmarked: bookmarked })
  },

  async toggleBookmark() {
    if (this.data.bookmarkLoading) return
    this.setData({ bookmarkLoading: true })

    try {
      if (this.data.isBookmarked) {
        await removeBookmark(this.articleId)
        wx.showToast({ title: '已取消收藏', icon: 'none' })
      } else {
        await addBookmark(this.articleId)
        wx.showToast({ title: '已收藏', icon: 'success' })
      }
      this.setData({ isBookmarked: !this.data.isBookmarked })
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      this.setData({ bookmarkLoading: false })
    }
  },

  onTapLink() {
    const url = this.data.article.link
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showToast({ title: '链接已复制', icon: 'success' })
      }
    })
  },

  onToggleSummary() {
    this.setData({
      showOriginal: !this.data.showOriginal
    })
  }
})
