// pages/units/units.js
const { unitApi } = require('../../utils/api.js')

Page({
  data: {
    unitList: [],
    isLoading: false
  },

  onLoad() {
    this.loadUnits()
  },

  onShow() {
    this.loadUnits()
  },

  /**
   * 加载单位列表
   */
  loadUnits() {
    if (this.data.isLoading) return;

    this.setData({ isLoading: true });

    wx.showLoading({ title: '加载中...' });

    // 使用API获取单位列表
    unitApi.getUnitList()
      .then(units => {
        console.log('从API加载单位列表:', units);

        // 确保单位数据格式正确
        const formattedUnits = (units || []).map(unit => ({
          ...unit,
          id: unit.id || unit.unit_id,
          name: unit.name || unit.unit_name,
          address: unit.address || unit.unit_address,
          contactName: unit.contact_name || unit.contactName,
          contactPhone: unit.contact_phone || unit.contactPhone,
          isDefault: unit.is_default || unit.isDefault || false,
          createTime: unit.created_at || unit.createTime
        }));

        this.setData({
          unitList: formattedUnits
        });
      })
      .catch(err => {
        console.error('加载单位列表失败', err);
        // 回退到本地存储
        const units = wx.getStorageSync('units') || [];
        this.setData({
          unitList: units
        });
      })
      .finally(() => {
        this.setData({ isLoading: false });
        wx.hideLoading();
      });
  },

  /**
   * 添加单位
   */
  addUnit() {
    wx.navigateTo({
      url: '/pages/unit-edit/unit-edit?mode=add'
    })
  },

  /**
   * 查看单位订单
   */
  viewUnitOrders(e) {
    const unitId = e.currentTarget.dataset.id;
    const unitName = e.currentTarget.dataset.name;
    wx.navigateTo({
      url: `/pages/orders/orders?unitId=${unitId}&unitName=${encodeURIComponent(unitName)}`
    });
  },

  /**
   * 编辑单位
   */
  editUnit(e) {
    const unit = e.currentTarget.dataset.unit;
    wx.navigateTo({
      url: `/pages/unit-edit/unit-edit?mode=edit&id=${unit.id}`
    })
  },

  /**
   * 设为默认
   */
  setDefault(e) {
    const id = e.currentTarget.dataset.id;

    wx.showLoading({ title: '设置中...' });

    unitApi.setDefaultUnit(id)
      .then(response => {
        // 重新加载单位列表以更新默认状态
        this.loadUnits();
        wx.showToast({
          title: '设置成功',
          icon: 'success'
        });
      })
      .catch(err => {
        console.error('设置默认单位失败', err);
        wx.hideLoading();
        wx.showToast({
          title: '设置失败，请重试',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  /**
   * 删除单位
   */
  deleteUnit(e) {
    const id = e.currentTarget.dataset.id;

    wx.showModal({
      title: '提示',
      content: '确定要删除这个单位吗？',
      confirmText: '删除',
      confirmColor: '#ff4757',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });

          unitApi.deleteUnit(id)
            .then(response => {
              // 重新加载单位列表
              this.loadUnits();
              wx.hideLoading();
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
            })
            .catch(err => {
              console.error('删除单位失败', err);
              wx.hideLoading();
              wx.showToast({
                title: '删除失败，请重试',
                icon: 'none'
              });
            });
        }
      }
    });
  }
})