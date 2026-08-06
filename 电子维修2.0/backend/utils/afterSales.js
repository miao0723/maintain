// backend/utils/afterSales.js
// 售后/质保/建议 相关的纯函数工具，供路由层复用

/**
 * 计算质保起止日期
 * @param {object} order 订单对象（需含 completed_at / updated_at / is_warranty）
 * @param {number} warrantyMonths 设备默认质保月数（user_devices.warranty_months），缺省 3
 */
function computeWarranty(order, warrantyMonths) {
  const months = (warrantyMonths && warrantyMonths > 0) ? warrantyMonths : 3;
  const days = months * 30;
  const base = order.completed_at ? new Date(order.completed_at) : new Date(order.updated_at || Date.now());
  const start = new Date(base);
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return {
    warranty_start_date: fmt(start),
    warranty_end_date: fmt(end),
    warranty_period_days: days,
    warranty_type: order.is_warranty ? '返修' : '整备'
  };
}

/**
 * 根据质保到期日计算状态
 * @returns {{status: 'in'|'out'|'none', remaining_days: number}}
 */
function warrantyStatus(endDate) {
  if (!endDate) return { status: 'none', remaining_days: 0 };
  const end = new Date(endDate);
  const now = new Date();
  const status = end >= new Date(now.toDateString()) ? 'in' : 'out';
  const remaining = Math.max(0, Math.ceil((end - now) / 86400000));
  return { status, remaining_days: remaining };
}

/**
 * 生成保养 / 换新 / 质保 建议
 * @param {object} device 设备信息（含 device_type_id, purchase_date）
 * @param {Array} orders 该设备的订单列表（含 status, problem_description, custom_description）
 * @param {{status:string, remaining_days:number}} warranty 当前质保状态
 */
function generateAdvice(device, orders, warranty) {
  const advice = [];
  const list = orders || [];
  const completed = list.filter(o => o.status === 'completed');
  const completedCount = completed.length;

  // 机龄
  let ageYears = null;
  if (device && device.purchase_date) {
    const purchase = new Date(device.purchase_date);
    if (!isNaN(purchase.getTime())) {
      ageYears = (Date.now() - purchase.getTime()) / (365 * 24 * 3600 * 1000);
    }
  }

  // 同故障复发检测（简单关键词重叠）
  const keywords = ['屏幕', '电池', '充电', '进水', '主板', '不开机', '无法开机', '摄像头', '听筒', '扬声器', 'WiFi', '信号'];
  const buckets = {};
  list.forEach(o => {
    const text = ((o.problem_description || '') + ' ' + (o.custom_description || '')).toLowerCase();
    keywords.forEach(k => { if (text.includes(k.toLowerCase())) buckets[k] = (buckets[k] || 0) + 1; });
  });
  const recurring = Object.keys(buckets).filter(k => buckets[k] >= 2);

  // 通用保养建议
  advice.push({
    type: 'maintain',
    title: '定期清洁与保养',
    content: '建议每 3 个月清理一次设备接口与散热孔，避免灰尘导致过热或接触不良；长期不使用时保持电量在 50% 左右存放。'
  });

  // 按设备类型给针对性保养
  const typeId = device ? Number(device.device_type_id) : -1;
  if (typeId === 1) {
    advice.push({
      type: 'maintain',
      title: '电池保养',
      content: '手机电池建议保持电量在 20%-80% 之间，避免长期满充或耗尽；维修后首周留意续航与发热表现。'
    });
  } else if (typeId === 2) {
    advice.push({
      type: 'maintain',
      title: '笔记本保养',
      content: '建议每半年清理一次风扇与散热鳍片，长期插电使用可开启电池养护模式，避免电池长期满电老化。'
    });
  } else if (typeId === 4) {
    advice.push({
      type: 'maintain',
      title: '手表保养',
      content: '防水手表维修后 24 小时内避免进水与充电；表带建议定期清洗，运动出汗后及时擦拭。'
    });
  }

  // 多次维修提醒
  if (completedCount >= 2) {
    advice.push({
      type: 'warning',
      title: '多次维修提醒',
      content: `该设备已完成 ${completedCount} 次维修，若同一故障反复出现，建议申请质保维修或评估是否换新。`
    });
  }

  // 同故障复发
  if (recurring.length > 0) {
    advice.push({
      type: 'warning',
      title: '同故障复发',
      content: `「${recurring.join('、')}」类问题已出现多次，若在质保期内请直接申请质保维修，否则建议重点检测相关模块或考虑换新。`
    });
  }

  // 机龄换新建议
  if (ageYears !== null && ageYears >= 3) {
    advice.push({
      type: 'upgrade',
      title: '建议评估换新',
      content: `设备机龄约 ${ageYears.toFixed(1)} 年，维修成本可能接近换新成本，建议评估是否换新更划算。`
    });
  }

  // 在保提醒
  if (warranty && warranty.status === 'in') {
    advice.push({
      type: 'warranty',
      title: '当前在保',
      content: `设备处于质保期内（剩余 ${warranty.remaining_days} 天），出现问题可直接申请质保维修，免检测费。`
    });
  }

  return advice;
}

module.exports = { computeWarranty, warrantyStatus, generateAdvice };
