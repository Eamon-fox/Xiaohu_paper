const api = require('../../utils/api')

// 模拟模式：设为 true 可不请求后端测试UI
const MOCK_MODE = false
const MOCK_STEPS = ['抓取 RSS', 'HTML 清洗', '去重', '补充摘要', '语义过滤', '生成摘要', '输出结果']

Page({
  data: {
    dates: [],
    loading: true,
    pipelineRunning: false,
    pipelineStatus: null,
    pipelineStep: ''
  },

  onLoad() {
    this.fetchDates()
  },

  onShow() {
    if (!MOCK_MODE) {
      this.fetchPipelineStatus()
    }
  },

  fetchDates() {
    this.setData({ loading: true })
    api.getArchiveDates().then(res => {
      this.setData({
        dates: res.dates || [],
        loading: false
      })
    }).catch(() => {
      this.setData({ loading: false })
    })
  },

  fetchPipelineStatus() {
    api.getTriggerStatus().then(res => {
      this.setData({
        pipelineRunning: res.running,
        pipelineStatus: res,
        pipelineStep: res.progress?.step_desc || ''
      })
      if (res.running) {
        this.pollStatus()
      }
    }).catch(() => {})
  },

  onTrigger() {
    if (this.data.pipelineRunning) {
      wx.showToast({ title: '流水线运行中', icon: 'none' })
      return
    }

    wx.showModal({
      title: '确认',
      content: '确定要触发流水线生成新日报吗？',
      success: (res) => {
        if (res.confirm) {
          this.triggerPipeline()
        }
      }
    })
  },

  triggerPipeline() {
    if (MOCK_MODE) {
      this.setData({ pipelineRunning: true, pipelineStep: MOCK_STEPS[0] })
      wx.showToast({ title: '已触发', icon: 'success' })
      this.mockPollStatus(0)
      return
    }

    wx.showLoading({ title: '触发中...' })
    api.triggerPipeline().then(res => {
      wx.hideLoading()
      this.setData({ pipelineRunning: true })
      wx.showToast({ title: '已触发', icon: 'success' })
      this.pollStatus()
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '触发失败', icon: 'none' })
    })
  },

  mockPollStatus(stepIndex) {
    setTimeout(() => {
      if (stepIndex < MOCK_STEPS.length - 1) {
        this.setData({ pipelineStep: MOCK_STEPS[stepIndex + 1] })
        this.mockPollStatus(stepIndex + 1)
      } else {
        this.setData({ pipelineRunning: false, pipelineStep: '' })
        wx.showToast({ title: '生成完成', icon: 'success' })
      }
    }, 2000)
  },

  pollStatus() {
    const poll = () => {
      api.getTriggerStatus().then(res => {
        this.setData({
          pipelineRunning: res.running,
          pipelineStatus: res,
          pipelineStep: res.progress?.step_desc || ''
        })
        if (res.running) {
          setTimeout(poll, 3000)
        } else {
          this.setData({ pipelineStep: '' })
          if (res.last_status === 'success') {
            wx.showToast({ title: '生成完成', icon: 'success' })
            this.fetchDates()
          } else if (res.last_status === 'failed') {
            wx.showToast({ title: '生成失败', icon: 'none' })
          }
        }
      })
    }
    setTimeout(poll, 3000)
  },

  onTapDate(e) {
    const { date, version } = e.currentTarget.dataset
    const app = getApp()
    app.globalData.pendingDate = date
    app.globalData.pendingVersion = version
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  onPullDownRefresh() {
    this.fetchDates()
    this.fetchPipelineStatus()
    wx.stopPullDownRefresh()
  }
})
