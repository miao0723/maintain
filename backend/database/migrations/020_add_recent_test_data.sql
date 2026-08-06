-- 添加近期的测试数据到统计表
-- 这样统计页面就能显示数据了

USE cmms_db;

-- 删除旧的演示数据（如果没有源数据的记录）
DELETE FROM `statistics_income_records` WHERE `source_type` IS NULL;

-- 插入近期（最近10天）的收入数据
INSERT INTO `statistics_income_records` (`record_date`, `payment_method`, `order_count`, `amount`, `remark`, `created_at`, `updated_at`) VALUES
(CURDATE() - INTERVAL 9 DAY, 'online', 8, 6580.00, '线上维修收款', NOW(), NOW()),
(CURDATE() - INTERVAL 9 DAY, 'transfer', 3, 2820.00, '企业客户转账', NOW(), NOW()),
(CURDATE() - INTERVAL 8 DAY, 'online', 12, 9850.00, '线上维修收款', NOW(), NOW()),
(CURDATE() - INTERVAL 8 DAY, 'transfer', 4, 3640.00, '单位客户转账', NOW(), NOW()),
(CURDATE() - INTERVAL 7 DAY, 'online', 10, 8240.00, '线上维修收款', NOW(), NOW()),
(CURDATE() - INTERVAL 7 DAY, 'transfer', 5, 4580.00, '对公转账', NOW(), NOW()),
(CURDATE() - INTERVAL 6 DAY, 'online', 15, 12360.00, '线上维修收款', NOW(), NOW()),
(CURDATE() - INTERVAL 6 DAY, 'transfer', 6, 5480.00, '大客户回款', NOW(), NOW()),
(CURDATE() - INTERVAL 5 DAY, 'online', 14, 11520.00, '线上维修收款', NOW(), NOW()),
(CURDATE() - INTERVAL 5 DAY, 'transfer', 4, 3680.00, '企业客户转账', NOW(), NOW()),
(CURDATE() - INTERVAL 4 DAY, 'online', 18, 14820.00, '线上维修收款', NOW(), NOW()),
(CURDATE() - INTERVAL 4 DAY, 'transfer', 7, 6320.00, '单位客户转账', NOW(), NOW()),
(CURDATE() - INTERVAL 3 DAY, 'online', 16, 13160.00, '线上维修收款', NOW(), NOW()),
(CURDATE() - INTERVAL 3 DAY, 'transfer', 5, 4620.00, '企业客户转账', NOW(), NOW()),
(CURDATE() - INTERVAL 2 DAY, 'online', 20, 16480.00, '线上维修收款', NOW(), NOW()),
(CURDATE() - INTERVAL 2 DAY, 'transfer', 8, 7280.00, '大额转账', NOW(), NOW()),
(CURDATE() - INTERVAL 1 DAY, 'online', 22, 18040.00, '线上维修收款', NOW(), NOW()),
(CURDATE() - INTERVAL 1 DAY, 'transfer', 6, 5520.00, '企业客户转账', NOW(), NOW()),
(CURDATE(), 'online', 24, 19760.00, '线上维修收款', NOW(), NOW()),
(CURDATE(), 'transfer', 9, 8160.00, '单位客户结算', NOW(), NOW())
ON DUPLICATE KEY UPDATE amount = VALUES(amount);

-- 插入近期的支出数据
DELETE FROM `statistics_expense_records`;

INSERT INTO `statistics_expense_records` (`expense_date`, `category`, `description`, `amount`, `payment_method`, `operator`, `created_at`, `updated_at`) VALUES
(CURDATE() - INTERVAL 9 DAY, 'purchase', '采购液压泵密封组件', 2860.00, '转账', '张三', NOW(), NOW()),
(CURDATE() - INTERVAL 9 DAY, 'operation', '仓储与物流费用', 960.00, '转账', '李四', NOW(), NOW()),
(CURDATE() - INTERVAL 8 DAY, 'salary', '外勤工程师绩效补贴', 5200.00, '转账', '王五', NOW(), NOW()),
(CURDATE() - INTERVAL 8 DAY, 'other', '客户现场差旅费', 720.00, '现金', '赵六', NOW(), NOW()),
(CURDATE() - INTERVAL 7 DAY, 'purchase', '采购电机碳刷与轴承', 3580.00, '转账', '张三', NOW(), NOW()),
(CURDATE() - INTERVAL 7 DAY, 'operation', '办公室网络与电话费', 660.00, '转账', '李四', NOW(), NOW()),
(CURDATE() - INTERVAL 6 DAY, 'salary', '维修中心月度工资', 9800.00, '转账', '王五', NOW(), NOW()),
(CURDATE() - INTERVAL 6 DAY, 'purchase', '采购控制板与继电器', 4320.00, '转账', '张三', NOW(), NOW()),
(CURDATE() - INTERVAL 5 DAY, 'operation', '门店水电与物业费', 1680.00, '转账', '李四', NOW(), NOW()),
(CURDATE() - INTERVAL 5 DAY, 'other', '应急工具购置', 980.00, '现金', '赵六', NOW(), NOW()),
(CURDATE() - INTERVAL 4 DAY, 'purchase', '采购压力传感器批次', 5240.00, '转账', '张三', NOW(), NOW()),
(CURDATE() - INTERVAL 4 DAY, 'operation', '短视频推广投流', 1860.00, '转账', '李四', NOW(), NOW()),
(CURDATE() - INTERVAL 3 DAY, 'salary', '售后客服与仓管工资', 7300.00, '转账', '王五', NOW(), NOW()),
(CURDATE() - INTERVAL 3 DAY, 'purchase', '采购工业润滑油', 1480.00, '转账', '张三', NOW(), NOW()),
(CURDATE() - INTERVAL 2 DAY, 'operation', '办公耗材采购', 560.00, '转账', '李四', NOW(), NOW()),
(CURDATE() - INTERVAL 2 DAY, 'other', '设备运输保险', 960.00, '转账', '赵六', NOW(), NOW()),
(CURDATE() - INTERVAL 1 DAY, 'purchase', '采购显示模组与排线', 3720.00, '转账', '张三', NOW(), NOW()),
(CURDATE() - INTERVAL 1 DAY, 'salary', '驻场工程师补助', 4400.00, '转账', '王五', NOW(), NOW()),
(CURDATE(), 'operation', '同城加急配送费', 780.00, '转账', '李四', NOW(), NOW()),
(CURDATE(), 'purchase', '采购常用维修小料', 1540.00, '转账', '张三', NOW(), NOW());

-- 删除旧订单数据并插入近期订单数据
DELETE FROM `statistics_order_records` WHERE `source_type` IS NULL;

INSERT INTO `statistics_order_records` (`order_no`, `customer_name`, `machine_type`, `fault_desc`, `amount`, `status`, `created_at`, `updated_at`) VALUES
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 9 DAY, '%Y%m%d'), '001'), '上海建工', '挖掘机', '液压系统压力不足', 2680.00, 'completed', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 9 DAY, '%Y%m%d'), '002'), '中建三局', '起重机', '回转机构异响', 4220.00, 'processing', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 8 DAY, '%Y%m%d'), '001'), '北京城建', '装载机', '变速箱顿挫', 3860.00, 'completed', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 8 DAY, '%Y%m%d'), '002'), '江苏交通', '压路机', '制动系统告警', 1750.00, 'pending', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 7 DAY, '%Y%m%d'), '001'), '浙江建设', '叉车', '仪表无法点亮', 1260.00, 'completed', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 7 DAY, '%Y%m%d'), '002'), '山东路桥', '挖掘机', '空调制冷异常', 1680.00, 'cancelled', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 6 DAY, '%Y%m%d'), '001'), '河南建工', '混凝土泵车', '泵送压力波动', 5320.00, 'processing', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 6 DAY, '%Y%m%d'), '002'), '湖北路桥', '平地机', '转向油缸漏油', 2420.00, 'completed', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 5 DAY, '%Y%m%d'), '001'), '深圳机电', '发电机组', '控制柜通讯故障', 3580.00, 'completed', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 5 DAY, '%Y%m%d'), '002'), '广州港机', '堆高机', '动力电池衰减', 6240.00, 'processing', NOW(), NOW()),
(CONCAT('WO',Date_FORMAT(CURDATE() - INTERVAL 4 DAY, '%Y%m%d'), '001'), '苏州装备', '激光切割机', '激光头偏移', 4180.00, 'completed', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 4 DAY, '%Y%m%d'), '002'), '宁波制造', '数控车床', '主轴温升过高', 2960.00, 'pending', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 3 DAY, '%Y%m%d'), '001'), '天津重工', '吊车', '支腿传感器异常', 1840.00, 'completed', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 3 DAY, '%Y%m%d'), '002'), '青岛船厂', '空压机', '排气温度过高', 2160.00, 'processing', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 2 DAY, '%Y%m%d'), '001'), '武汉城建', '挖掘机', '先导阀卡滞', 1680.00, 'completed', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 2 DAY, '%Y%m%d'), '002'), '成都设备', '包装机', '伺服驱动报码', 3520.00, 'completed', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 1 DAY, '%Y%m%d'), '001'), '厦门物流', '叉车', '起升速度变慢', 1380.00, 'pending', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 1 DAY, '%Y%m%d'), '002'), '合肥制造', '注塑机', '加热区温控失灵', 2860.00, 'processing', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE(), '%Y%m%d'), '001'), '重庆建设', '压路机', '振动马达故障', 2140.00, 'completed', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE(), '%Y%m%d'), '002'), '福州机修', '发电机组', '油压异常报警', 2580.00, 'processing', NOW(), NOW())
ON DUPLICATE KEY UPDATE amount = VALUES(amount);

-- 删除旧超时数据并插入近期超时数据
DELETE FROM `statistics_timeout_records`;

INSERT INTO `statistics_timeout_records` (`order_no`, `customer_name`, `timeout_type`, `timeout_minutes`, `reason`, `responsible`, `solution`, `created_at`, `updated_at`) VALUES
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 9 DAY, '%Y%m%d'), '002'), '中建三局', 'response', 135, '工程师跨区支援返程延迟', '张三', '已调整附近工程师优先响应', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 8 DAY, '%Y%m%d'), '002'), '江苏交通', 'repair', 960, '待专用刹车阀到货', '李四', '已发起加急采购', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 7 DAY, '%Y%m%d'), '002'), '山东路桥', 'delivery', 720, '客户现场临时停工无法交付', '王五', '改期至下一个工作日', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 6 DAY, '%Y%m%d'), '001'), '河南建工', 'repair', 1260, '泵送总成拆检复杂度高于预估', '赵六', '增加高级工程师协同处理', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 5 DAY, '%Y%m%d'), '002'), '广州港机', 'response', 88, '现场高峰时段交通拥堵', '张三', '已建立港区值守机制', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 4 DAY, '%Y%m%d'), '002'), '宁波制造', 'delivery', 1560, '客户追加检测项目', '李四', '重新确认交付时间', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 3 DAY, '%Y%m%d'), '002'), '青岛船厂', 'repair', 840, '高温故障复现时间较长', '王五', '延长老化测试并补充备件', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 2 DAY, '%Y%m%d'), '002'), '合肥制造', 'response', 54, '上个项目收尾导致出发延后', '赵六', '优化排班并缩短交接时间', NOW(), NOW()),
(CONCAT('WO', DATE_FORMAT(CURDATE() - INTERVAL 1 DAY, '%Y%m%d'), '002'), '福州机修', 'delivery', 690, '客户现场验收负责人临时请假', '张三', '已预约次日上午复验', NOW(), NOW());
