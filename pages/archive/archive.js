const api = require('../../utils/api')

Page({
  data: {
    dates: [],
    loading: true,
    isEmpty: false
  },

  onLoad() {
    this.fetchHistory()
  },

  onShow() {
    // 每次显示页面时静默刷新
    if (!this.data.loading) {
      this.silentRefresh()
    }
  },

  async silentRefresh() {
    try {
      const res = await api.getMyHistory()
      this.setData({
        dates: res.dates || [],
        isEmpty: !res.dates || res.dates.length === 0
      })
    } catch (err) {
      console.error('静默刷新失败', err)
    }
  },

  async fetchHistory() {
    this.setData({ loading: true })
    try {
      const res = await api.getMyHistory()
      this.setData({
        dates: res.dates || [],
        loading: false,
        isEmpty: !res.dates || res.dates.length === 0
      })
    } catch (err) {
      console.error('获取历史日报失败', err)
      this.setData({ loading: false, isEmpty: true })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  onTapDate(e) {
    const { date } = e.currentTarget.dataset
    const app = getApp()
    app.globalData.pendingDate = date
    app.globalData.pendingVersion = null
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  onPullDownRefresh() {
    this.fetchHistory().finally(() => {
      wx.stopPullDownRefresh()
    })
  }
})
