const { getConfig, updateVipKeywords, updateSemanticAnchors, resetConfig, getUserInfo } = require('../../utils/config')
const api = require('../../utils/api')
const app = getApp()

Page({
  data: {
    loading: true,
    userInfo: null,
    config: null,
    saving: false,

    // VIP关键词列表
    tier1List: [],
    tier2List: [],
    tier3List: [],

    // 语义锚点列表
    positiveList: [],
    negativeList: [],

    // 编辑弹窗
    showEditModal: false,
    editModalTitle: '',
    editModalPlaceholder: '',
    editValue: '',
    editType: '',      // 'positive', 'negative', 'tier1', 'tier2', 'tier3'
    editIndex: -1,     // -1 表示新增

    // 帮助弹窗
    showHelpModal: false,
    helpTitle: '',
    helpContent: ''
  },

  onLoad() {
    this.loadAllData()
  },

  goToBookmarks() {
    wx.switchTab({ url: '/pages/bookmarks/bookmarks' })
  },

  onShow() {
    // 每次显示页面时静默刷新（用户可能在详情页"收藏并学习"或在收藏夹删除）
    if (!this.data.loading) {
      this.silentRefresh()
    }
  },

  async silentRefresh() {
    try {
      const [userInfo, config] = await Promise.all([
        getUserInfo(),
        getConfig().catch(() => null)
      ])

      const formData = this.configToFormData(config || this.data.config)
      this.setData({
        userInfo,
        config: config || this.data.config,
        ...formData
      })
    } catch (err) {
      console.error('静默刷新失败', err)
    }
  },

  async loadAllData() {
    this.setData({ loading: true })
    try {
      const [userInfo, config] = await Promise.all([
        getUserInfo(),
        getConfig()
      ])

      const formData = this.configToFormData(config)
      this.setData({
        userInfo,
        config,
        loading: false,
        ...formData
      })
    } catch (err) {
      console.error('加载数据失败', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  async loadUserInfo() {
    try {
      const userInfo = await getUserInfo()
      this.setData({ userInfo })
    } catch (err) {
      console.error('加载用户信息失败', err)
    }
  },

  configToFormData(config) {
    if (!config) return {}
    const vip = config.vip_keywords || {}
    const anchors = config.semantic_anchors || {}

    return {
      tier1List: vip.tier1?.patterns || [],
      tier2List: vip.tier2?.patterns || [],
      tier3List: vip.tier3?.patterns || [],
      positiveList: anchors.positive || [],
      negativeList: anchors.negative || []
    }
  },

  formDataToConfig() {
    return {
      vipKeywords: {
        tier1: { multiplier: 1.50, patterns: this.data.tier1List },
        tier2: { multiplier: 1.30, patterns: this.data.tier2List },
        tier3: { multiplier: 1.15, patterns: this.data.tier3List }
      },
      semanticAnchors: {
        positive: this.data.positiveList,
        negative: this.data.negativeList
      }
    }
  },

  // VIP关键词操作
  onAddTier1() {
    this.setData({
      showEditModal: true,
      editModalTitle: '添加 Tier 1 关键词',
      editModalPlaceholder: '输入关键词或正则表达式',
      editValue: '',
      editType: 'tier1',
      editIndex: -1
    })
  },

  onAddTier2() {
    this.setData({
      showEditModal: true,
      editModalTitle: '添加 Tier 2 关键词',
      editModalPlaceholder: '输入关键词或正则表达式',
      editValue: '',
      editType: 'tier2',
      editIndex: -1
    })
  },

  onAddTier3() {
    this.setData({
      showEditModal: true,
      editModalTitle: '添加 Tier 3 关键词',
      editModalPlaceholder: '输入关键词或正则表达式',
      editValue: '',
      editType: 'tier3',
      editIndex: -1
    })
  },

  onEditTier(e) {
    const { tier, index } = e.currentTarget.dataset
    const list = this.data[`${tier}List`]
    this.setData({
      showEditModal: true,
      editModalTitle: `编辑 ${tier.replace('tier', 'Tier ')} 关键词`,
      editModalPlaceholder: '输入关键词或正则表达式',
      editValue: list[index],
      editType: tier,
      editIndex: index
    })
  },

  onDeleteTier(e) {
    const { tier, index } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个关键词吗？',
      success: (res) => {
        if (res.confirm) {
          const listKey = `${tier}List`
          const list = [...this.data[listKey]]
          list.splice(index, 1)
          this.setData({ [listKey]: list })
        }
      }
    })
  },

  // 添加锚点
  onAddPositive() {
    if (this.data.positiveList.length >= 10) {
      wx.showToast({ title: '最多添加10条', icon: 'none' })
      return
    }
    this.setData({
      showEditModal: true,
      editModalTitle: '添加正向锚点',
      editModalPlaceholder: '粘贴一段你感兴趣的论文摘要（英文原文效果最佳）',
      editValue: '',
      editType: 'positive',
      editIndex: -1
    })
  },

  onAddNegative() {
    if (this.data.negativeList.length >= 10) {
      wx.showToast({ title: '最多添加10条', icon: 'none' })
      return
    }
    this.setData({
      showEditModal: true,
      editModalTitle: '添加负向锚点',
      editModalPlaceholder: '粘贴一段你不想看到的论文摘要（英文原文效果最佳）',
      editValue: '',
      editType: 'negative',
      editIndex: -1
    })
  },

  // 编辑锚点
  onEditPositive(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      showEditModal: true,
      editModalTitle: '编辑正向锚点',
      editModalPlaceholder: '粘贴一段你感兴趣的论文摘要（英文原文效果最佳）',
      editValue: this.data.positiveList[index],
      editType: 'positive',
      editIndex: index
    })
  },

  onEditNegative(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      showEditModal: true,
      editModalTitle: '编辑负向锚点',
      editModalPlaceholder: '粘贴一段你不想看到的论文摘要（英文原文效果最佳）',
      editValue: this.data.negativeList[index],
      editType: 'negative',
      editIndex: index
    })
  },

  // 删除锚点
  onDeletePositive(e) {
    const index = e.currentTarget.dataset.index
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条锚点吗？',
      success: (res) => {
        if (res.confirm) {
          const list = [...this.data.positiveList]
          list.splice(index, 1)
          this.setData({ positiveList: list })
        }
      }
    })
  },

  onDeleteNegative(e) {
    const index = e.currentTarget.dataset.index
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条锚点吗？',
      success: (res) => {
        if (res.confirm) {
          const list = [...this.data.negativeList]
          list.splice(index, 1)
          this.setData({ negativeList: list })
        }
      }
    })
  },

  // 弹窗操作
  onEditValueChange(e) {
    this.setData({ editValue: e.detail.value })
  },

  onCloseModal() {
    this.setData({ showEditModal: false })
  },

  onConfirmEdit() {
    const { editValue, editType, editIndex } = this.data
    const value = editValue.trim()

    if (!value) {
      wx.showToast({ title: '内容不能为空', icon: 'none' })
      return
    }

    // 处理 VIP 关键词
    if (editType.startsWith('tier')) {
      const listKey = `${editType}List`
      const list = [...this.data[listKey]]
      if (editIndex === -1) {
        list.push(value)
      } else {
        list[editIndex] = value
      }
      this.setData({ [listKey]: list, showEditModal: false })
      return
    }

    // 处理语义锚点（限制10条）
    const listKey = editType === 'positive' ? 'positiveList' : 'negativeList'
    const list = [...this.data[listKey]]

    if (editIndex === -1) {
      if (list.length >= 10) {
        wx.showToast({ title: '最多添加10条', icon: 'none' })
        return
      }
      list.push(value)
    } else {
      list[editIndex] = value
    }
    this.setData({ [listKey]: list, showEditModal: false })
  },

  preventBubble() {},

  // 帮助弹窗
  onShowVipHelp() {
    this.setData({
      showHelpModal: true,
      helpTitle: 'VIP 关键词说明',
      helpContent: `<p><strong>什么是 VIP 关键词？</strong></p>
<p>当文章标题或摘要中包含你设置的关键词时，该文章会获得分数加成并高亮显示。</p>

<p style="margin-top:16px;"><strong>⚠️ 避免假阳性</strong></p>
<p style="color:#c62828;">短词或常见词会匹配大量无关文章：</p>
<p>• <span style="background:#ffebee;color:#c62828;padding:2px 6px;border-radius:4px;">cell</span> 几乎所有生物文章都包含</p>
<p>• <span style="background:#ffebee;color:#c62828;padding:2px 6px;border-radius:4px;">RNA</span> 会匹配 mRNA、lncRNA 等</p>
<p>• <span style="background:#ffebee;color:#c62828;padding:2px 6px;border-radius:4px;">model</span> 太泛化，推荐用具体名称</p>

<p style="margin-top:16px;"><strong>正则语法</strong></p>
<p>• <span style="background:#e3f2fd;color:#1565c0;padding:2px 6px;border-radius:4px;font-family:monospace;">\\b</span> 单词边界，避免部分匹配</p>
<p>• <span style="background:#e3f2fd;color:#1565c0;padding:2px 6px;border-radius:4px;font-family:monospace;">.?</span> 匹配0或1个任意字符</p>
<p>• <span style="background:#e3f2fd;color:#1565c0;padding:2px 6px;border-radius:4px;font-family:monospace;">.*</span> 匹配任意多个字符</p>

<p style="margin-top:16px;"><strong>推荐写法</strong></p>
<p>• <span style="background:#e8f5e9;color:#2e7d32;padding:2px 6px;border-radius:4px;font-family:monospace;">\\bCRISPR\\b</span> 精确匹配 CRISPR</p>
<p>• <span style="background:#e8f5e9;color:#2e7d32;padding:2px 6px;border-radius:4px;font-family:monospace;">single.?cell</span> 匹配 single-cell 或 single cell</p>
<p>• <span style="background:#e8f5e9;color:#2e7d32;padding:2px 6px;border-radius:4px;font-family:monospace;">AlphaFold</span> 专有名词可直接用</p>`
    })
  },

  onShowAnchorHelp() {
    this.setData({
      showHelpModal: true,
      helpTitle: '语义锚点说明',
      helpContent: `<p><strong>工作原理</strong></p>
<p>系统使用向量相似度计算文章与锚点的语义相关性。锚点文本会被转换为向量，与候选文章进行相似度匹配。</p>

<p style="margin-top:16px;"><strong>重要提示</strong></p>
<p>这不是简单的"兴趣标签"！写"我对生物信息学感兴趣"<strong>不会</strong>产生好的效果。</p>

<p style="margin-top:16px;"><strong>推荐做法</strong></p>
<p>• <strong>最佳：</strong>直接粘贴你领域内经典论文的英文摘要</p>
<p>• <strong>次选：</strong>粘贴你发表过或正在写的论文摘要</p>
<p>• <strong>可用：</strong>用英文描述具体的研究问题和方法</p>

<p style="margin-top:16px;"><strong>快速积累</strong></p>
<p>收藏文章时选择"收藏并学习"，系统会自动将文章摘要添加为正向锚点。多收藏几篇感兴趣的文章，个性化推荐就会越来越准确。</p>

<p style="margin-top:16px;"><strong>示例（正向锚点）</strong></p>
<p style="font-size:24rpx;color:#666;background:#f5f5f5;padding:12px;border-radius:8px;margin-top:8px;">Single-cell RNA sequencing reveals the heterogeneity of liver-resident immune cells in human...</p>`
    })
  },

  onCloseHelp() {
    this.setData({ showHelpModal: false })
  },

  // 保存配置
  async onSave() {
    if (this.data.saving) return
    this.setData({ saving: true })

    try {
      const { vipKeywords, semanticAnchors } = this.formDataToConfig()

      await Promise.all([
        updateVipKeywords(vipKeywords),
        updateSemanticAnchors(semanticAnchors)
      ])

      // 刷新数据确保与服务器同步
      await this.silentRefresh()

      wx.showModal({
        title: '配置已保存',
        content: '是否重新生成日报？已阅读的文章不会出现，需要保存请先收藏。',
        confirmText: '重新生成',
        cancelText: '稍后',
        success: async (res) => {
          if (res.confirm) {
            try {
              wx.showLoading({ title: '开始生成...' })
              await api.regenerateMyDaily()
              wx.hideLoading()
              wx.showToast({ title: '已开始生成', icon: 'success' })
              // 标记首页需要刷新
              app.globalData.shouldRefreshDaily = true
              setTimeout(() => {
                wx.switchTab({ url: '/pages/index/index' })
              }, 1000)
            } catch (err) {
              wx.hideLoading()
              console.error('触发生成失败', err)
              wx.showToast({ title: '触发失败', icon: 'none' })
            }
          } else {
            wx.showToast({ title: '保存成功', icon: 'success' })
          }
        }
      })
    } catch (err) {
      console.error('保存配置失败', err)
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  },

  onReset() {
    wx.showModal({
      title: '确认重置',
      content: '确定要将所有配置恢复为默认值吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '重置中...' })
            const result = await resetConfig()

            // 更新表单显示
            const formData = this.configToFormData(result.config)
            this.setData({ config: result.config, ...formData })
            wx.hideLoading()

            // 提示重新生成日报
            wx.showModal({
              title: '配置已重置',
              content: '是否重新生成日报？已阅读的文章不会出现，需要保存请先收藏。',
              confirmText: '重新生成',
              cancelText: '稍后',
              success: async (modalRes) => {
                if (modalRes.confirm) {
                  try {
                    wx.showLoading({ title: '开始生成...' })
                    await api.regenerateMyDaily()
                    wx.hideLoading()
                    wx.showToast({ title: '已开始生成', icon: 'success' })
                    app.globalData.shouldRefreshDaily = true
                    setTimeout(() => {
                      wx.switchTab({ url: '/pages/index/index' })
                    }, 1000)
                  } catch (err) {
                    wx.hideLoading()
                    console.error('触发生成失败', err)
                    wx.showToast({ title: '触发失败', icon: 'none' })
                  }
                }
              }
            })
          } catch (err) {
            wx.hideLoading()
            console.error('重置失败', err)
            wx.showToast({ title: '重置失败', icon: 'none' })
          }
        }
      }
    })
  },

  onClearReadHistory() {
    wx.showModal({
      title: '清空已读记录',
      content: '清空后，之前阅读过的文章将重新出现在日报中。确定清空吗？',
      confirmText: '确定清空',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '清空中...' })
            await api.clearReadHistory()
            wx.hideLoading()
            wx.showToast({ title: '已清空', icon: 'success' })
            // 标记首页需要刷新
            app.globalData.shouldRefreshDaily = true
          } catch (err) {
            wx.hideLoading()
            console.error('清空已读记录失败', err)
            wx.showToast({ title: '清空失败', icon: 'none' })
          }
        }
      }
    })
  },

  onPullDownRefresh() {
    this.loadAllData().finally(() => {
      wx.stopPullDownRefresh()
    })
  }
})
