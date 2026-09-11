'use strict';

/**
 * 客服 Agent 2 —— 查询型（工具调用）智能体
 * ------------------------------------------------------------
 * 职责：当用户的问题是关于「订单 / 维修进度 / 我的设备 / 在保状态 /
 *       维修履历 / 订单列表」等需要查数据的场景时，调用后端工具（SQL）
 *       真实查询数据库，并把结果组织成自然语言回复。
 *
 * 与 Agent 1（维修/回收专业回答）的区别：
 *   - Agent 1 负责"怎么修、多少钱、能不能修"等知识型专业回答；
 *   - 本 Agent 负责"帮我查一下"等数据查询型请求，所有回答都来自真实数据。
 *
 * 所有工具查询都带 userId 权限约束，只能查到当前用户自己的数据。
 */

const db = require('../database');
const { computeWarranty, warrantyStatus } = require('../utils/afterSales');

class QueryAgent {
  constructor() {
    this.name = 'query';
  }

  // ===================== 工具：表存在性（兼容 repair / cmms_db 双 schema） =====================
  async tableExists(schemaName, tableName) {
    try {
      const rows = await db.query(
        `SELECT 1 FROM information_schema.tables
         WHERE table_schema = ? AND table_name = ? LIMIT 1`,
        [schemaName, tableName]
      );
      return rows.length > 0;
    } catch (error) {
      return false;
    }
  }

  async queryWithSchemaFallback(tableName, sqlBuilder) {
    const schemas = ['repair', 'cmms_db'];
    for (const schema of schemas) {
      if (!(await this.tableExists(schema, tableName))) continue;
      try {
        const { sql, params = [] } = sqlBuilder(schema);
        const rows = await db.query(sql, params);
        if (Array.isArray(rows) && rows.length > 0) {
          return { rows, schema };
        }
      } catch (error) {
        console.error(`[QueryAgent] 查询 ${schema}.${tableName} 失败:`, error.message);
      }
    }
    return { rows: [], schema: null };
  }

  // ===================== 工具 1：订单进度 =====================
  async queryOrderProgress(orderId, userId = null) {
    return this.queryWithSchemaFallback('orders', (schema) => {
      let sql = `
        SELECT id, order_id AS order_no, device_model, problem_description,
               status, progress, progress_updated_at, updated_at, is_warranty
        FROM ${schema}.orders
        WHERE (order_id = ? OR id = ?)
      `;
      const params = [orderId, /^\d+$/.test(String(orderId)) ? Number(orderId) : -1];
      if (userId) {
        sql += ' AND user_id = ?';
        params.push(userId);
      }
      sql += ' ORDER BY updated_at DESC LIMIT 1';
      return { sql, params };
    });
  }

  formatOrderProgressReply(row, schema) {
    const updatedTime = row.progress_updated_at || row.updated_at || '暂无更新时间';
    const progressText = row.progress !== null && row.progress !== undefined ? `${row.progress}%` : '暂无';
    const warrantyTag = row.is_warranty ? '（质保单）' : '';
    return {
      reply: `已为您查到订单${warrantyTag}信息：订单号 ${row.order_no}，当前状态「${row.status}」，维修进度 ${progressText}，设备 ${row.device_model || '未填写'}，故障描述「${row.problem_description || '未填写'}」，最后更新 ${updatedTime}。您也可以在「我的订单」中查看实时状态。`,
      suggestedActions: [
        { type: 'quick_reply', text: '这个订单什么时候修好？' },
        { type: 'quick_reply', text: '这个订单报价多少？' },
        { type: 'button', text: '查看我的订单', action: 'query_order' }
      ]
    };
  }

  // ===================== 工具 2：我的设备列表（含在保状态） =====================
  async getUserDevices(userId) {
    if (!userId) return [];
    let devices;
    try {
      devices = await db.query(
        `SELECT d.id, d.device_nickname, d.device_model, d.device_brand,
                d.device_type_name, d.purchase_date, d.warranty_months,
                CASE WHEN d.device_type_id = 0 THEN d.device_type_name ELSE dt.name END AS type_name
         FROM user_devices d
         LEFT JOIN device_types dt ON d.device_type_id = dt.id
         WHERE d.user_id = ?
         ORDER BY d.is_default DESC, d.updated_at DESC`,
        [userId]
      );
    } catch (e) {
      // device_types 表可能不存在，退化为不带 JOIN 的查询
      console.error('[QueryAgent] getUserDevices(带JOIN)失败，尝试退化查询:', e.message);
      try {
        devices = await db.query(
          `SELECT d.id, d.device_nickname, d.device_model, d.device_brand,
                  d.device_type_name, d.purchase_date, d.warranty_months
           FROM user_devices d
           WHERE d.user_id = ?
           ORDER BY d.is_default DESC, d.updated_at DESC`,
          [userId]
        );
        devices = devices.map(d => ({ ...d, type_name: d.device_type_name || '' }));
      } catch (e2) {
        console.error('[QueryAgent] getUserDevices 失败:', e2.message);
        return [];
      }
    }

    for (const d of devices) {
      try {
        const w = await db.query(
          `SELECT id, completed_at, updated_at, warranty_end_date, warranty_period_days
           FROM orders WHERE device_id = ? AND status = 'completed'
           ORDER BY COALESCE(completed_at, updated_at) DESC LIMIT 1`,
          [d.id]
        );
        if (w[0]) {
          let info = w[0];
          if (!info.warranty_end_date) {
            const ww = computeWarranty(info, d.warranty_months);
            await db.query(
              `UPDATE orders SET warranty_start_date=?, warranty_end_date=?, warranty_period_days=?, warranty_type=?
               WHERE id=?`,
              [ww.warranty_start_date, ww.warranty_end_date, ww.warranty_period_days, ww.warranty_type, info.id]
            ).catch(() => {});
            info = { ...info, ...ww };
          }
          const st = warrantyStatus(info.warranty_end_date);
          d.warranty_status = st.status;
          d.warranty_remaining_days = st.remaining_days;
          d.warranty_end_date = info.warranty_end_date;
        } else {
          d.warranty_status = 'none';
          d.warranty_remaining_days = 0;
        }
      } catch (e) {
        d.warranty_status = 'none';
        d.warranty_remaining_days = 0;
      }
    }
    return devices;
  }

  // ===================== 工具 3：订单列表 =====================
  async getOrderList(userId) {
    if (!userId) return [];
    try {
      const rows = await db.query(
        `SELECT id, order_id, order_type, device_type_name, device_model,
                problem_description, status, progress, is_warranty, updated_at
         FROM orders WHERE user_id = ?
         ORDER BY updated_at DESC LIMIT 10`,
        [userId]
      );
      return rows;
    } catch (e) {
      console.error('[QueryAgent] getOrderList 失败:', e.message);
      return [];
    }
  }

  // ===================== 工具 4：设备维修履历 =====================
  async getDeviceRepairHistory(userId, deviceId = null) {
    if (!userId) return [];
    let sql = `
      SELECT o.id AS order_pk, o.order_id, o.status AS order_status, o.device_model,
             o.problem_description, rr.stage, rr.title, rr.description, rr.created_at AS record_at
      FROM orders o
      LEFT JOIN repair_records rr ON rr.order_id = o.id
      WHERE o.user_id = ?
    `;
    const params = [userId];
    if (deviceId) {
      sql += ' AND o.device_id = ?';
      params.push(deviceId);
    }
    sql += ' ORDER BY o.updated_at DESC, rr.created_at ASC';
    try {
      const rows = await db.query(sql, params);
      return rows;
    } catch (e) {
      console.error('[QueryAgent] getDeviceRepairHistory 失败:', e.message);
      return [];
    }
  }

  // ===================== 工具 5：在保状态 =====================
  async getWarrantyStatus(userId, deviceId = null) {
    if (!userId) return null;
    let sql = `
      SELECT o.id, o.order_id, o.device_model, o.warranty_end_date,
             o.warranty_period_days, o.warranty_type, o.completed_at, o.updated_at
      FROM orders o
      WHERE o.user_id = ? AND o.status = 'completed'
    `;
    const params = [userId];
    if (deviceId) {
      sql += ' AND o.device_id = ?';
      params.push(deviceId);
    }
    sql += ' ORDER BY COALESCE(o.completed_at, o.updated_at) DESC LIMIT 1';
    const rows = await db.query(sql, params);
    if (rows.length === 0) return null;
    let info = rows[0];
    if (!info.warranty_end_date) {
      // 取设备默认质保月数
      let months = 3;
      if (deviceId) {
        const dev = await db.query('SELECT warranty_months FROM user_devices WHERE id = ?', [deviceId]).catch(() => []);
        if (dev[0] && dev[0].warranty_months) months = dev[0].warranty_months;
      }
      const ww = computeWarranty(info, months);
      await db.query(
        `UPDATE orders SET warranty_start_date=?, warranty_end_date=?, warranty_period_days=?, warranty_type=? WHERE id=?`,
        [ww.warranty_start_date, ww.warranty_end_date, ww.warranty_period_days, ww.warranty_type, info.id]
      ).catch(() => {});
      info = { ...info, ...ww };
    }
    const st = warrantyStatus(info.warranty_end_date);
    return { ...info, status: st.status, remaining_days: st.remaining_days };
  }

  // ===================== 实体 / 意图辅助 =====================
  extractOrderId(message) {
    // 优先匹配显式「订单号/单号：XXX」，其次「订单 XXX」，再次订单号格式（ORD... 或长串字母数字）
    let m = message.match(/(?:订单号|单号|订单编号)[：:\s]*([A-Za-z0-9\-]+)/i);
    if (m && m[1]) return m[1];
    m = message.match(/(?:订单|单号)\s*([A-Za-z0-9\-]{4,})/i);
    if (m && m[1]) return m[1];
    m = message.match(/\b(ORD[\-]?\d+|[A-Za-z0-9]{8,})\b/i);
    if (m && m[1]) return m[1];
    return null;
  }

  // 订单状态 → 中文文案 + 样式类（用于前端渲染徽标）
  mapOrderStatus(s) {
    const map = {
      pending: { text: '待检测', cls: 'st-pending' },
      quoted: { text: '报价中', cls: 'st-quoted' },
      quoting: { text: '报价中', cls: 'st-quoted' },
      processing: { text: '维修中', cls: 'st-processing' },
      repairing: { text: '维修中', cls: 'st-processing' },
      review: { text: '待评价', cls: 'st-review' },
      completed: { text: '已完成', cls: 'st-completed' },
      cancelled: { text: '已取消', cls: 'st-cancelled' },
      waiting_pickup: { text: '待取机', cls: 'st-pending' },
      shipped: { text: '已发货', cls: 'st-shipped' }
    };
    const key = String(s || '').toLowerCase();
    return map[key] || { text: String(s || '未知'), cls: 'st-unknown' };
  }

  // 将一行订单整理成前端可直接渲染的结构
  normalizeOrderCard(o) {
    const st = this.mapOrderStatus(o.status);
    const progress = (o.progress === null || o.progress === undefined) ? null : Number(o.progress);
    return {
      id: o.id,
      order_id: o.order_id || o.order_no || '',
      order_type: o.order_type || '',
      device_model: o.device_model || o.device_type_name || '设备',
      problem_description: o.problem_description || '',
      status: o.status,
      statusText: st.text,
      statusClass: st.cls,
      progress,
      is_warranty: !!o.is_warranty,
      updated_at: o.updated_at ? String(o.updated_at) : ''
    };
  }

  // 在保状态 → 中文文案 + 样式类（用于前端渲染徽标）
  mapWarrantyStatus(s) {
    const map = {
      in: { text: '质保中', cls: 'w-in' },
      out: { text: '已过保', cls: 'w-out' },
      none: { text: '未绑定质保', cls: 'w-none' }
    };
    return map[String(s || 'none')] || map.none;
  }

  // 将一行设备整理成前端可直接渲染的结构（含在保徽标）
  normalizeDeviceCard(d) {
    const ws = this.mapWarrantyStatus(d.warranty_status);
    const name = d.device_nickname || d.device_model || d.type_name || d.device_type_name || '设备';
    return {
      id: d.id,
      name,
      nickname: d.device_nickname || '',
      brand: d.device_brand || '',
      model: d.device_model || '',
      type_name: d.type_name || d.device_type_name || '',
      purchase_date: d.purchase_date ? String(d.purchase_date).slice(0, 10) : '',
      warranty_status: d.warranty_status || 'none',
      warranty_text: ws.text,
      warranty_class: ws.cls,
      remaining_days: d.warranty_remaining_days || 0,
      warranty_end_date: d.warranty_end_date ? String(d.warranty_end_date).slice(0, 10) : ''
    };
  }

  // 将一条在保记录整理成前端可直接渲染的结构
  normalizeWarrantyCard(war, deviceName) {
    const ws = this.mapWarrantyStatus(war.status);
    return {
      device_name: deviceName || '设备',
      order_id: war.order_id || '',
      status: war.status,
      status_text: ws.text,
      status_class: ws.cls,
      remaining_days: war.remaining_days || 0,
      warranty_end_date: war.warranty_end_date ? String(war.warranty_end_date).slice(0, 10) : '',
      warranty_type: war.warranty_type || ''
    };
  }

  // 将一条（按订单聚合的）维修履历整理成前端可直接渲染的结构
  normalizeHistoryCard(order, records) {
    const st = this.mapOrderStatus(order.status);
    return {
      order_id: order.order_id,
      order_pk: order.order_pk,
      device_model: order.device_model || '',
      status: order.status,
      status_text: st.text,
      status_class: st.cls,
      problem: order.problem || '',
      records: records || []
    };
  }

  matchDevice(message, devices) {
    if (!devices || devices.length === 0) return null;
    const lower = message.toLowerCase();
    // 优先按昵称 / 型号 / 品牌精确匹配
    for (const d of devices) {
      const candidates = [d.device_nickname, d.device_model, d.device_brand, d.type_name, d.device_type_name]
        .filter(Boolean)
        .map(String)
        .map(s => s.toLowerCase());
      if (candidates.some(c => c && lower.includes(c))) return d;
    }
    return null;
  }

  // ===================== 主流程 =====================
  async processMessage(message, conversationHistory = [], userId = null) {
    try {
      const lower = message.toLowerCase();
      const orderId = this.extractOrderId(message);

      // 进度 / 状态类问法的通用信号（无具体单号时，若已登录则回退到订单列表）
      const asksProgress = /(进度|状态|到哪|修完|好了吗|完成没|什么时候好|多久能好|现在什么情况|处理到哪|修得怎样|修好没)/.test(lower);
      const asksList = /(我的订单|订单列表|所有订单|历史订单|订单记录|查一下订单|查订单|帮我看订单|看我的订单|订单查询|查我的订单)/.test(lower);

      // --- 场景 A：指定了订单号 → 查这一单的进度 ---
      if (orderId) {
        const { rows, schema } = await this.queryOrderProgress(orderId, userId);
        if (rows.length > 0) {
          const r = this.formatOrderProgressReply(rows[0], schema);
          return this._wrap(
            r.reply,
            r.suggestedActions,
            'progress',
            { type: 'order_list', orders: [this.normalizeOrderCard(rows[0])] }
          );
        }
        // 没查到该订单号
        if (!userId) {
          return this._wrap('请提供订单号，或先在小程序登录后到「我的订单」查看进度~',
            [{ type: 'button', text: '查看我的订单', action: 'query_order' }], 'progress');
        }
        return this._wrap('没有查到该订单号对应的记录，请确认订单号是否正确。您也可以直接说「我的订单」查看全部订单~',
          [{ type: 'button', text: '查看我的订单', action: 'query_order' }], 'progress');
      }

      // --- 场景 B：订单列表 / 进度查询（无具体单号） ---
      if (asksList || (asksProgress && userId)) {
        if (!userId) {
          return this._wrap('请先在小程序登录，即可查看您的全部订单~',
            [{ type: 'button', text: '查看我的订单', action: 'query_order' }], 'order_list');
        }
        const orders = await this.getOrderList(userId);
        if (orders.length === 0) {
          return this._wrap('您当前还没有订单记录。需要维修或回收设备，可以随时发起~',
            [{ type: 'button', text: '去报修', action: 'book_repair' },
             { type: 'button', text: '去回收', action: 'submit_recycle' }], 'order_list');
        }
        const cards = orders.slice(0, 6).map(o => this.normalizeOrderCard(o));
        const lines = cards.map((c, i) =>
          `${i + 1}. ${c.order_id} · ${c.device_model} · ${c.statusText}${c.is_warranty ? '（质保单）' : ''}`
        );
        const intro = asksProgress
          ? `已为您查到当前订单的进度（共 ${orders.length} 条），点卡片可看详情：`
          : `已为您查到最近的订单（共 ${orders.length} 条），点卡片可看详情与进度：`;
        return this._wrap(
          `${intro}\n${lines.join('\n')}`,
          [{ type: 'button', text: '查看我的订单', action: 'query_order' }],
          'order_list',
          { type: 'order_list', orders: cards }
        );
      }

      // --- 场景 C：设备相关（在保 / 维修履历 / 设备列表） ---
      const wantsWarranty = /(在保|还在保|质保状态|保修状态|保修期|过保|质保到期|保修到期|保修到)/.test(lower);
      const wantsHistory = /(维修记录|维修履历|修过|历史维修|维修历史|上次修|之前修|修过几次|修了多少次)/.test(lower);
      const wantsDevices = /(我的设备|设备列表|绑定.*设备|有哪些设备|几台设备|设备管理)/.test(lower);

      if (wantsWarranty || wantsHistory || wantsDevices) {
        if (!userId) {
          return this._wrap('请先在小程序登录，即可查看您的设备、在保状态和维修履历~',
            [{ type: 'button', text: '我的设备', action: 'show_my_devices' }], 'device');
        }
        const devices = await this.getUserDevices(userId);

        if (wantsHistory) {
          const matched = this.matchDevice(message, devices);
          const history = await this.getDeviceRepairHistory(userId, matched ? matched.id : null);
          if (history.length === 0) {
            return this._wrap(
              matched
                ? `「${matched.device_nickname || matched.device_model || '该设备'}」暂时没有维修记录，说明它一直很健康~`
                : '您目前还没有维修记录。',
              [{ type: 'button', text: '我的设备', action: 'show_my_devices' }], 'repair_history');
          }
          // 按订单聚合
          const byOrder = {};
          for (const h of history) {
            if (!byOrder[h.order_id]) {
              byOrder[h.order_id] = {
                order_id: h.order_id, order_pk: h.order_pk, device: h.device_model,
                status: h.order_status, problem: h.problem_description, records: []
              };
            }
            if (h.title) {
              byOrder[h.order_id].records.push({
                stage: h.stage || '',
                title: h.title,
                description: h.description || '',
                date: String(h.record_at).slice(0, 10)
              });
            }
          }
          const cards = Object.values(byOrder).slice(0, 5).map(b => this.normalizeHistoryCard(b, b.records));
          const lines = cards.map(c => {
            const rec = c.records.length ? `\n    ${c.records.map(r => `- ${r.stage} ${r.title}（${r.date}）`).join('\n    ')}` : '';
            return `订单 ${c.order_id} · ${c.device_model || ''} · ${c.problem || ''} · 状态「${c.status_text}」${rec}`;
          });
          const target = matched ? `「${matched.device_nickname || matched.device_model}」的` : '';
          return this._wrap(
            `这是您${target}维修履历：\n${lines.join('\n')}\n点卡片可查看对应订单详情。`,
            [{ type: 'button', text: '我的设备', action: 'show_my_devices' }], 'repair_history',
            { type: 'repair_history', orders: cards });
        }

        if (wantsWarranty) {
          const matched = this.matchDevice(message, devices);
          const war = await this.getWarrantyStatus(userId, matched ? matched.id : null);
          if (!war) {
            return this._wrap(
              matched
                ? `「${matched.device_nickname || matched.device_model}」暂未查询到在保记录，可能尚未完成维修或已超出质保期。`
                : '暂未查询到在保记录，可能您还没有已完成维修的订单，或质保已到期。',
              [{ type: 'button', text: '我的设备', action: 'show_my_devices' }], 'warranty');
          }
          const tag = war.status === 'in' ? `质保中（剩余 ${war.remaining_days} 天）` : '已过保';
          const target = matched ? `「${matched.device_nickname || matched.device_model}」` : '您最近完成维修的设备';
          const card = this.normalizeWarrantyCard(war, target.replace(/[「」]/g, ''));
          return this._wrap(
            `${target}当前【${tag}】，${war.status === 'in' ? `到期日 ${war.warranty_end_date}。` : `已于 ${war.warranty_end_date} 到期。`}质保期内同故障可免费返修。`,
            [{ type: 'button', text: '我的设备', action: 'show_my_devices' },
             { type: 'quick_reply', text: '申请质保维修' }], 'warranty',
            { type: 'warranty', warranties: [card] });
        }

        // 默认：设备列表
        if (devices.length === 0) {
          return this._wrap('您还没有绑定任何设备。绑定设备后可以统一管理维修履历与保修状态哦~',
            [{ type: 'button', text: '去绑定设备', action: 'show_my_devices' }], 'device_list');
        }
        const cards = devices.map(d => this.normalizeDeviceCard(d));
        const lines = cards.map((c, i) =>
          `${i + 1}. ${c.name}${c.warranty_text !== '未绑定质保' ? ` · ${c.warranty_text}` : ''}`
        );
        return this._wrap(
          `您当前共绑定 ${devices.length} 台设备：\n${lines.join('\n')}\n点卡片可查看设备详情、在保与维修履历。`,
          [{ type: 'button', text: '我的设备', action: 'show_my_devices' }], 'device_list',
          { type: 'device_list', devices: cards });
      }

      // --- 兜底：不属于查询类，交给 supervisor 路由到 Agent 1 ---
      return this._wrap(null, [], 'unknown');
    } catch (error) {
      // 不向用户暴露任何错误话术；返回 null 让 supervisor 回退到专业回答 Agent，
      // 由更上层的路由兜底生成自然回复，避免客服出现"查询出错"之类的生硬回答。
      console.error('[QueryAgent] 处理失败，回退到专业回答 Agent:', error.message);
      return this._wrap(null, [], 'error');
    }
  }

  _wrap(reply, suggestedActions, intent, data = null) {
    return {
      reply,
      suggestedActions,
      intent,
      entities: {},
      confidence: 0.9,
      requiresHuman: false,
      agent: 'query',
      data
    };
  }
}

module.exports = { QueryAgent };
