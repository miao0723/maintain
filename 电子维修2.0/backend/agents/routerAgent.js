'use strict';

/**
 * 客服总控（Supervisor / Router）
 * ------------------------------------------------------------
 * 把用户消息路由到两个子 Agent：
 *   - RepairRecycleAgent（agent='repair_recycle'）：维修 / 回收类知识型专业回答
 *   - QueryAgent（agent='query'）：订单 / 进度 / 我的设备 / 在保 / 维修履历 等数据查询
 *
 * 路由原则：
 *   只要消息命中"查数据"信号（订单、进度、我的设备、在保、维修记录等），
 *   就交给 QueryAgent；其余一律交给 RepairRecycleAgent 做专业回答。
 *   若 QueryAgent 判断不属于查询类（返回 reply 为 null），则回退给 RepairRecycleAgent。
 */

const { RepairRecycleAgent } = require('./repairRecycleAgent');
const { QueryAgent } = require('./queryAgent');

class CustomerServiceRouter {
  constructor() {
    this.repairRecycleAgent = new RepairRecycleAgent();
    this.queryAgent = new QueryAgent();
  }

  /**
   * 判断消息是否应路由到查询型 Agent
   */
  shouldRouteToQuery(message) {
    const m = String(message || '').toLowerCase();
    const querySignals = [
      // 订单 / 进度
      /(我的订单|订单列表|所有订单|历史订单|订单记录|查订单|查一下订单|订单进度|订单状态|维修进度|维修到哪|到什么程度|修得怎么样|修完没|好了吗|什么时候好|多久能好|物流|快递|发货|签收|到货)/,
      // 我的设备 / 设备管理
      /(我的设备|设备列表|绑定.*设备|有哪些设备|几台设备|设备管理|设备详情)/,
      // 在保 / 质保状态
      /(在保|还在保|质保状态|保修状态|保修期|过保|质保到期|保修到期|保修到|质保还有)/,
      // 维修履历
      /(维修记录|维修履历|修过|历史维修|维修历史|上次修|之前修|修过几次|修了多少次)/,
      // 明确带订单号
      /(订单号|单号)\s*[:：]?\s*\w{6,}/
    ];
    return querySignals.some(re => re.test(m));
  }

  async processMessage(message, conversationHistory = [], userId = null) {
    try {
      if (this.shouldRouteToQuery(message)) {
        const qResult = await this.queryAgent.processMessage(message, conversationHistory, userId);
        // QueryAgent 明确返回了内容（reply 非空），使用它
        if (qResult && qResult.reply) {
          return qResult;
        }
        // 否则回退到专业回答 Agent
        return await this.repairRecycleAgent.processMessage(message, conversationHistory, userId);
      }

      // 默认走维修 / 回收专业回答 Agent
      return await this.repairRecycleAgent.processMessage(message, conversationHistory, userId);
    } catch (error) {
      console.error('[CustomerServiceRouter] 路由失败:', error.message);
      // 兜底：交给专业回答 Agent 的规则回复
      try {
        return await this.repairRecycleAgent.processMessage(message, conversationHistory, userId);
      } catch (e2) {
        return {
          reply: '客服系统暂时繁忙，请稍后再试或转人工客服。',
          suggestedActions: [],
          requiresHuman: true,
          confidence: 0.0,
          intent: 'error',
          entities: {},
          agent: 'router'
        };
      }
    }
  }
}

// 单例
const customerServiceRouter = new CustomerServiceRouter();

module.exports = { CustomerServiceRouter, customerServiceRouter };
