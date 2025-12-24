const api = require('../../utils/api')
const app = getApp()

Page({
  data: {
    articles: [],
    date: '',
    loading: true,
    queryDate: '',
    queryVersion: null,
    // 个性化日报生成状态
    generating: false,
    taskId: null,
    taskStatus: null,
    generatingStep: '',
    progressPercent: 0,
    progressDetail: '',
    // 错误状态
    error: false,
    errorMsg: '',
    // 是否为个性化日报
    isPersonalized: false
  },

  onLoad() {
    this.fetchDaily()
  },

  goToProfile() {
    wx.switchTab({ url: '/pages/profile/profile' })
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
    } else if (app.globalData.shouldRefreshDaily) {
      app.globalData.shouldRefreshDaily = false
      this.fetchDaily()
    }
    // 不做任何事 - 保持当前状态，不重新加载
  },

  async fetchDaily() {
    const { queryDate } = this.data
    this.setData({ loading: true, generating: false, error: false })

    const token = wx.getStorageSync('token')

    // 有 token -> 永远用个性化日报（包括历史日期）
    // 无 token -> 不该出现，需要登录
    if (token) {
      await this.fetchMyDaily(queryDate)
    } else {
      this.showError('请先登录')
    }
  },

  // 获取个性化日报
  // autoTrigger: 404时是否自动触发生成（防止死循环）
  async fetchMyDaily(date, autoTrigger = true) {
    try {
      const res = await api.getMyDaily(date)
      const statusCode = res.statusCode

      if (statusCode === 200) {
        this.displayArticles(res.data)
      } else if (statusCode === 202) {
        const taskId = res.data.detail?.task_id
        this.setData({
          loading: false,
          generating: true,
          taskId,
          taskStatus: res.data.detail?.status || 'running',
          generatingStep: '正在为你生成个性化日报...'
        })
        if (taskId) {
          this.pollTaskStatus(taskId)
        }
      } else if (statusCode === 404) {
        this.setData({ loading: false })
        if (autoTrigger) {
          this.triggerGenerate()
        } else {
          this.showError('生成完成但获取失败，请刷新')
        }
      } else {
        console.error('意外状态码:', statusCode, res.data)
        this.showError(`服务异常 (${statusCode})`)
      }
    } catch (err) {
      console.error('获取个性化日报失败', err)
      this.showError('网络错误，请下拉刷新重试')
    }
  },

  // 触发生成个性化日报
  async triggerGenerate() {
    try {
      this.setData({
        generating: true,
        generatingStep: '正在启动生成任务...'
      })

      const res = await api.regenerateMyDaily()
      const taskId = res.task_id

      this.setData({
        taskId,
        taskStatus: 'pending',
        generatingStep: '任务已创建，正在生成...'
      })

      this.pollTaskStatus(taskId)
    } catch (err) {
      console.error('触发生成失败', err)
      this.setData({ generating: false })
      this.showError('生成失败，请重试')
    }
  },

  // 轮询任务状态
  pollTaskStatus(taskId) {
    // 清除之前的轮询
    if (this.pollTimer) {
      clearTimeout(this.pollTimer)
    }

    const poll = async () => {
      // 页面已销毁则停止
      if (!this.data) return

      try {
        const task = await api.getMyDailyTask(taskId)
        this.setData({ taskStatus: task.status })

        if (task.status === 'done') {
          this.setData({ generating: false, generatingStep: '', progressPercent: 0 })
          this.pollTimer = null
          this.fetchMyDaily(this.data.queryDate, false)
        } else if (task.status === 'failed') {
          this.setData({ generating: false, generatingStep: '', progressPercent: 0 })
          this.pollTimer = null
          this.showError(task.error || '生成失败')
        } else {
          // 使用 progress 字段显示详细进度
          const p = task.progress
          if (p && p.step_name) {
            const stepInfo = p.current && p.total
              ? `${p.step_name} (${p.current}/${p.total})`
              : p.step_name
            this.setData({
              generatingStep: stepInfo,
              progressPercent: p.percent || 0,
              progressDetail: p.detail || ''
            })
          } else {
            // 无 progress 字段时，根据状态显示更详细的信息
            let stepText = '正在生成个性化日报...'
            if (task.status === 'pending') {
              stepText = '排队中，请稍候...'
            } else if (task.status === 'running') {
              stepText = '正在生成中，请稍候...'
            }
            this.setData({
              generatingStep: stepText,
              progressPercent: 0,
              progressDetail: ''
            })
          }
          this.pollTimer = setTimeout(poll, 300)
        }
      } catch (err) {
        console.error('查询任务状态失败', err)
        this.setData({ generating: false, generatingStep: '', progressPercent: 0 })
        this.pollTimer = null
        this.showError('查询状态失败，请下拉刷新')
      }
    }
    poll()
  },

  onUnload() {
    // 页面销毁时清除轮询
    if (this.pollTimer) {
      clearTimeout(this.pollTimer)
      this.pollTimer = null
    }
  },

  // 显示错误状态
  showError(msg) {
    this.setData({
      loading: false,
      generating: false,
      error: true,
      errorMsg: msg
    })
  },

  // 显示文章列表
  displayArticles(data) {
    const articles = (data.articles || []).map(item => ({
      ...item,
      scoreDisplay: (item.score * 100).toFixed(2)
    }))
    this.setData({
      articles,
      date: data.date || '',
      loading: false,
      generating: false,
      error: false,
      isPersonalized: true
    })
    // 历史日期显示日期标题
    if (this.data.queryDate) {
      wx.setNavigationBarTitle({ title: data.date || '日报' })
    } else {
      wx.setNavigationBarTitle({ title: '小狐Paper' })
    }
  },

  onTapArticle(e) {
    const id = e.currentTarget.dataset.id
    app.globalData.currentArticles = this.data.articles.map(a => a.id)

    // 自动标记已读（静默）
    api.markAsRead(id, this.data.date).catch(err => {
      console.error('标记已读失败', err)
    })

    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  onTapRegenerate() {
    if (this.data.generating) return
    wx.showModal({
      title: '重新生成',
      content: '已阅读的文章将不会出现在新日报中，需要保存请先收藏。确定重新生成吗？',
      success: (res) => {
        if (res.confirm) {
          this.triggerGenerate()
        }
      }
    })
  },

  onTapRetry() {
    this.fetchDaily()
  },

  onPullDownRefresh() {
    this.fetchDaily().finally(() => {
      wx.stopPullDownRefresh()
    })
  }
})
