const { BASE_URL } = require('./api')

// 登录并获取 token
function login() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (loginRes) => {
        wx.request({
          url: `${BASE_URL}/api/auth/wx-login`,
          method: 'POST',
          data: { code: loginRes.code },
          success: (res) => {
            if (res.data.token) {
              wx.setStorageSync('token', res.data.token)
              resolve(true)
            } else {
              resolve(false)
            }
          },
          fail: (err) => {
            console.error('登录失败', err)
            reject(err)
          }
        })
      },
      fail: (err) => {
        console.error('wx.login 失败', err)
        reject(err)
      }
    })
  })
}

// 获取 token（无则自动登录）
async function getToken() {
  let token = wx.getStorageSync('token')
  if (!token) {
    await login()
    token = wx.getStorageSync('token')
  }
  return token
}

// 清除 token
function clearToken() {
  wx.removeStorageSync('token')
}

// 带认证的请求封装
function authRequest(options) {
  return new Promise(async (resolve, reject) => {
    const token = await getToken()

    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        ...options.header,
        'Authorization': `Bearer ${token}`
      },
      success: async (res) => {
        // Token 过期，重新登录后重试
        if (res.statusCode === 401) {
          clearToken()
          try {
            await login()
            // 重试请求
            const newToken = wx.getStorageSync('token')
            wx.request({
              url: BASE_URL + options.url,
              method: options.method || 'GET',
              data: options.data,
              header: {
                ...options.header,
                'Authorization': `Bearer ${newToken}`
              },
              success: (retryRes) => resolve(retryRes),
              fail: (err) => reject(err)
            })
          } catch (err) {
            reject(err)
          }
        } else {
          resolve(res)
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络错误', icon: 'none' })
        reject(err)
      }
    })
  })
}

module.exports = { login, getToken, clearToken, authRequest }
