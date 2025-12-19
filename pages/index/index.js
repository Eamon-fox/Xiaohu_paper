const api = require('../../utils/api')
const app = getApp()

Page({
  data: {
    articles: [],
    date: '',
    loading: true,
    queryDate: '',
    queryVersion: null
  },

  onLoad() {
    this.fetchDaily()
  },

  onShow() {
    if (app.globalData.pendingDate) {
      this.setData({
        queryDate: app.globalData.pendingDate,
        queryVersion: app.globalData.pendingVersion
      })
      app.globalData.pendingDate = null
      app.globalData.pendingVersion = null
      this.fetchDaily()
    } else if (this.data.queryDate) {
      // 切换回今日 tab 时清除历史日期
      this.setData({ queryDate: '', queryVersion: null })
      wx.setNavigationBarTitle({ title: '小狐Paper' })
      this.fetchDaily()
    }
  },

  fetchDaily() {
    const { queryDate, queryVersion } = this.data
    this.setData({ loading: true })

    return api.getDaily(queryDate, queryVersion).then(res => {
      console.log('API响应:', res)
      const articles = (res.articles || []).map(item => ({
        ...item,
        scoreDisplay: (item.score * 100).toFixed(2)
      }))
      this.setData({
        articles,
        date: res.date || '',
        loading: false
      })
      if (queryDate) {
        wx.setNavigationBarTitle({ title: res.date || '日报' })
      }
    }).catch(() => {
      this.setData({ loading: false })
    })
  },

  onTapArticle(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  onPullDownRefresh() {
    this.fetchDaily().finally(() => {
      wx.stopPullDownRefresh()
    })
  }
})
