const api = require('../../utils/api')
const { addBookmark, removeBookmark, checkBookmarkStatus } = require('../../utils/bookmark')
const { getConfig, updateSemanticAnchors } = require('../../utils/config')
const app = getApp()

Page({
  data: {
    article: null,
    loading: true,
    showOriginal: false,
    isBookmarked: false,
    bookmarkLoading: false,
    hasPrev: false,
    hasNext: false,
    showNav: false
  },

  onLoad(options) {
    this.articleId = options.id
    this.articleIds = (app.globalData && app.globalData.currentArticles) || []
    this.setupNavigation()
    this.fetchArticle(options.id)
    this.checkBookmark(options.id)
  },

  setupNavigation() {
    // 转换为字符串比较，因为 URL 参数是字符串
    const index = this.articleIds.findIndex(id => String(id) === String(this.articleId))
    const showNav = this.articleIds.length > 0 && index !== -1
    this.setData({
      showNav,
      hasPrev: showNav && index > 0,
      hasNext: showNav && index < this.articleIds.length - 1
    })
    this.currentIndex = index
  },

  goPrev() {
    if (!this.data.hasPrev) return
    const prevId = this.articleIds[this.currentIndex - 1]
    this.navigateToArticle(prevId)
  },

  goNext() {
    if (!this.data.hasNext) return
    const nextId = this.articleIds[this.currentIndex + 1]
    this.navigateToArticle(nextId)
  },

  navigateToArticle(id) {
    this.articleId = id
    this.setData({ loading: true, showOriginal: false })
    this.setupNavigation()
    this.fetchArticle(id)
    this.checkBookmark(id)
  },

  fetchArticle(id) {
    api.getArticle(id).then(res => {
      this.setData({ article: res, loading: false })
    }).catch(() => {
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  async checkBookmark(id) {
    const bookmarked = await checkBookmarkStatus(id)
    this.setData({ isBookmarked: bookmarked })
  },

  async toggleBookmark() {
    if (this.data.bookmarkLoading) return

    const article = this.data.article
    if (!article) return

    if (this.data.isBookmarked) {
      // 取消收藏：弹窗询问是否同时移除偏好
      wx.showModal({
        title: '取消收藏',
        content: '是否同时从个性化偏好中移除？',
        confirmText: '移除偏好',
        cancelText: '仅取消',
        success: (res) => {
          this.doRemoveBookmark(res.confirm)
        }
      })
    } else {
      // 收藏：弹窗询问是否用于个性化推荐
      wx.showModal({
        title: '收藏文章',
        content: '是否将此文章用于个性化推荐？系统将学习你的研究偏好。',
        confirmText: '学习偏好',
        cancelText: '仅收藏',
        success: (res) => {
          this.doAddBookmark(res.confirm)
        }
      })
    }
  },

  async doAddBookmark(learnPreference) {
    this.setData({ bookmarkLoading: true })
    const article = this.data.article

    try {
      // 传递文章信息便于收藏列表直接显示
      await addBookmark(this.articleId, {
        title: article.title,
        journal: article.journal || article.source,
        date: article.published_at
      })

      if (learnPreference && article.content) {
        // 将文章内容添加到正向语义锚点
        try {
          const config = await getConfig()
          const currentAnchors = config.semantic_anchors?.positive || []
          // 避免重复添加，且限制最多10条
          if (currentAnchors.includes(article.content)) {
            wx.showToast({ title: '已收藏', icon: 'success' })
          } else if (currentAnchors.length >= 10) {
            wx.showToast({ title: '已收藏（锚点已满）', icon: 'none' })
          } else {
            await updateSemanticAnchors({
              positive: [...currentAnchors, article.content]
            })
            wx.showToast({ title: '已收藏并学习', icon: 'success' })
          }
        } catch (e) {
          console.error('更新语义锚点失败', e)
          wx.showToast({ title: '已收藏', icon: 'success' })
        }
      } else {
        wx.showToast({ title: '已收藏', icon: 'success' })
      }

      this.setData({ isBookmarked: true })
    } catch (err) {
      console.error('收藏失败', err)
      wx.showToast({ title: '收藏失败', icon: 'none' })
    } finally {
      this.setData({ bookmarkLoading: false })
    }
  },

  async doRemoveBookmark(removeFromAnchor) {
    this.setData({ bookmarkLoading: true })
    const article = this.data.article

    try {
      await removeBookmark(this.articleId)

      // 根据用户选择决定是否从语义锚点中移除
      if (removeFromAnchor && article.content) {
        try {
          const config = await getConfig()
          const currentAnchors = config.semantic_anchors?.positive || []
          const newAnchors = currentAnchors.filter(a => a !== article.content)
          if (newAnchors.length !== currentAnchors.length) {
            await updateSemanticAnchors({ positive: newAnchors })
            wx.showToast({ title: '已取消并移除偏好', icon: 'none' })
          } else {
            wx.showToast({ title: '已取消收藏', icon: 'none' })
          }
        } catch (e) {
          console.error('更新语义锚点失败', e)
          wx.showToast({ title: '已取消收藏', icon: 'none' })
        }
      } else {
        wx.showToast({ title: '已取消收藏', icon: 'none' })
      }

      this.setData({ isBookmarked: false })
    } catch (err) {
      console.error('取消收藏失败', err)
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
