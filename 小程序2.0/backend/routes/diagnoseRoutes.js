const express = require('express');
const router = express.Router();

// DeepSeek API 配置
const DEEPSEEK_API_KEY = process.env.Deepseek_api_key;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * 调用 DeepSeek 进行故障诊断
 */
async function callDeepSeekDiagnose(context) {
  const { deviceType, brand, symptom, details } = context;

  const systemPrompt = `你是一位专业的电子设备维修诊断专家，拥有20年维修经验。用户会描述他们的设备故障信息，请你：

1. 根据用户提供的设备类型、品牌、故障现象和细节，推断出**最可能的3个故障原因**（按可能性从高到低排列）
2. 对每个可能原因，给出**可能性百分比**和**简要解释**
3. 给出**建议的维修方案**（如更换某个部件、清理接口、软件修复等）
4. 给出**预估维修费用范围**（参考市场价格）
5. 给出**注意事项**（用户自己能尝试的简单排查、不要自行操作的事项等）

请用友好、专业的口吻回复。如果信息不充分，请明确指出还需要哪些信息才能更准确判断。

回复必须为 JSON 格式，不要包含 markdown 代码块标记：
{
  "summary": "一句话总结诊断结论",
  "causes": [
    { "reason": "故障原因1", "probability": 70, "explanation": "简要解释" },
    { "reason": "故障原因2", "probability": 25, "explanation": "简要解释" },
    { "reason": "故障原因3", "probability": 5, "explanation": "简要解释" }
  ],
  "repairPlan": "建议的维修方案",
  "estimatedCost": "预估费用范围",
  "notes": "注意事项"
}`;

  const userMessage = `设备类型: ${deviceType || '未指定'}
品牌: ${brand || '未指定'}
故障现象: ${symptom || '未指定'}
补充详情: ${details || '无'}

请根据以上信息进行故障诊断分析。`;

  try {
    console.log('[Diagnose] 调用 DeepSeek, 设备:', deviceType, brand);
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.5,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Diagnose] DeepSeek API 错误:', response.status, errorText);
      throw new Error(`DeepSeek API 调用失败: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content.trim();
    console.log('[Diagnose] DeepSeek 回复成功');

    // 清理可能的 markdown 代码块标记
    let jsonStr = rawContent;
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('[Diagnose] 诊断失败:', error.message);
    // 返回本地 fallback 诊断
    return generateLocalDiagnose(context);
  }
}

/**
 * 本地 fallback 诊断（DeepSeek 不可用时）
 */
function generateLocalDiagnose(context) {
  const { deviceType, symptom, brand } = context;

  const commonIssues = {
    '手机': [
      { reason: '屏幕排线或显示面板故障', probability: 60, explanation: '摔落或挤压可能导致屏幕内部连接松动或液晶损坏' },
      { reason: '电池老化或电池管理芯片故障', probability: 25, explanation: '电池寿命耗尽或充电管理芯片损坏导致无法开机' },
      { reason: '主板电源管理IC损坏', probability: 15, explanation: '电流异常可能烧毁主板的电源管理芯片' }
    ],
    '笔记本': [
      { reason: '主板供电模块故障', probability: 55, explanation: '长时间使用或电源波动可能损坏主板供电电路' },
      { reason: '电池完全耗尽或损坏', probability: 30, explanation: '电池过放保护或老化导致无法供电' },
      { reason: '内存条接触不良', probability: 15, explanation: '振动导致内存条松动，重新插拔可能解决' }
    ],
    '平板': [
      { reason: '电池过度放电或损坏', probability: 50, explanation: '长期未充电导致电池进入保护状态' },
      { reason: '屏幕触控层损坏', probability: 35, explanation: '摔落或挤压导致触控层内部断裂' },
      { reason: '充电口损坏', probability: 15, explanation: '充电口进灰或物理损伤导致无法充电' }
    ],
    '手表': [
      { reason: '电池故障', probability: 60, explanation: '智能手表电池容量小，老化速度较快' },
      { reason: '屏幕密封损坏进液', probability: 25, explanation: '日常使用中防水密封失效导致内部腐蚀' },
      { reason: '充电触点氧化', probability: 15, explanation: '汗液或水汽导致充电触点生锈接触不良' }
    ],
    '耳机': [
      { reason: '电池仓或耳机电池故障', probability: 55, explanation: '频繁充电导致电池寿命缩短' },
      { reason: '蓝牙模块故障', probability: 30, explanation: '蓝牙芯片损坏导致连接不稳定或无法连接' },
      { reason: '扬声器单元损坏', probability: 15, explanation: '音量过大或进水导致扬声器振膜损坏' }
    ],
    '相机': [
      { reason: '快门组件故障', probability: 45, explanation: '快门帘幕磨损或驱动马达故障' },
      { reason: 'CMOS传感器损坏', probability: 30, explanation: '激光照射或静电可能导致传感器损坏' },
      { reason: '镜头对焦马达卡死', probability: 25, explanation: '沙尘进入导致对焦机械结构卡滞' }
    ],
    '无人机': [
      { reason: '电池鼓包或电芯损坏', probability: 50, explanation: '高倍率放电加速电池老化' },
      { reason: '电调/电机故障', probability: 30, explanation: '过载或进水导致电调烧毁或电机轴承损坏' },
      { reason: '云台排线断裂', probability: 20, explanation: '反复折叠导致排线内部断路' }
    ],
    '游戏机': [
      { reason: '摇杆漂移（控制器）', probability: 55, explanation: '摇杆电位器磨损是最常见的游戏机故障' },
      { reason: '散热风扇故障', probability: 25, explanation: '灰尘堆积导致散热不良自动关机' },
      { reason: 'HDMI接口损坏', probability: 20, explanation: '频繁插拔或拉扯导致接口脱焊' }
    ]
  };

  const issues = commonIssues[deviceType] || [
    { reason: '电源相关故障', probability: 45, explanation: '电池或供电电路问题是最常见原因' },
    { reason: '内部连接问题', probability: 35, explanation: '内部排线松动或接口氧化' },
    { reason: '主板相关故障', probability: 20, explanation: '可能需要进一步检测确定具体损坏部件' }
  ];

  return {
    summary: `根据您的描述，${brand || ''}${deviceType || '设备'}的故障最可能由${issues[0].reason}引起。`,
    causes: issues,
    repairPlan: `建议携带设备到专业维修店进行全面检测，重点检查${issues[0].reason}。如检测确认，通常需要${issues[0].reason.includes('更换') ? '更换相关部件' : '维修相关组件'}。`,
    estimatedCost: '¥100 - ¥800（具体费用需检测后确定）',
    notes: '请勿自行拆机，避免造成二次损坏。送修前建议备份重要数据。如设备进水，请立即关机不要充电。'
  };
}

/**
 * POST /api/diagnose/analyze
 * 设备故障诊断
 */
router.post('/analyze', async (req, res) => {
  try {
    const { deviceType, brand, symptom, details } = req.body;

    if (!deviceType && !symptom) {
      return res.status(400).json({
        success: false,
        message: '请至少提供设备类型或故障现象'
      });
    }

    console.log('[Diagnose] 诊断请求:', { deviceType, brand, symptom });
    const result = await callDeepSeekDiagnose({ deviceType, brand, symptom, details });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Diagnose] 分析失败:', error);
    res.status(500).json({
      success: false,
      message: '诊断分析失败，请稍后重试'
    });
  }
});

module.exports = router;
