// app.js
const { login } = require('./utils/auth')

App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 预登录获取 token
    this.preLogin()
  },

  async preLogin() {
    try {
      const token = wx.getStorageSync('token')
      if (!token) {
        await login()
        console.log('预登录成功')
      }
    } catch (err) {
      console.error('预登录失败', err)
    }
  },

  globalData: {
    userInfo: null,
    pendingDate: null,
    pendingVersion: null,
    currentArticles: [],
    shouldRefreshDaily: false
  }
})
