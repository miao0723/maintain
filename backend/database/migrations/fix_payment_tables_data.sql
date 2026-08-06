-- 修复支付模块表中的中文字符乱码问题
-- 执行时间: 2026-04-20

-- 转账支付表数据修复
UPDATE `cmms_transfer_payments` SET
  `payee_name` = '王五',
  `bank_name` = '中国工商银行',
  `remark` = '支付维修费用'
WHERE `order_no` = 'TF20240120001';

UPDATE `cmms_transfer_payments` SET
  `payee_name` = '李四',
  `bank_name` = '中国建设银行',
  `remark` = '待财务确认'
WHERE `order_no` = 'TF20240120002';

UPDATE `cmms_transfer_payments` SET
  `payee_name` = '张三',
  `bank_name` = '支付宝',
  `remark` = '配件采购款'
WHERE `order_no` = 'TF20240119001';

UPDATE `cmms_transfer_payments` SET
  `payee_name` = '赵六',
  `bank_name` = '中国农业银行',
  `remark` = '账户信息有误，已取消'
WHERE `order_no` = 'TF20240118001';

UPDATE `cmms_transfer_payments` SET
  `payee_name` = '孙七',
  `bank_name` = '中国银行',
  `remark` = '设备采购'
WHERE `order_no` = 'TF20240117001';

UPDATE `cmms_transfer_payments` SET
  `payee_name` = '周八',
  `bank_name` = '微信',
  `remark` = '服务费支付'
WHERE `order_no` = 'TF20240116001';

UPDATE `cmms_transfer_payments` SET
  `payee_name` = '吴九',
  `bank_name` = '招商银行',
  `remark` = '待审核'
WHERE `order_no` = 'TF20240115001';

UPDATE `cmms_transfer_payments` SET
  `payee_name` = '郑十',
  `bank_name` = '交通银行',
  `remark` = '材料款'
WHERE `order_no` = 'TF20240114001';

-- 在线支付表数据修复
UPDATE `cmms_online_payments` SET
  `customer_name` = '张三',
  `remark` = '手机维修费用'
WHERE `order_no` = 'ORD20240324001';

UPDATE `cmms_online_payments` SET
  `customer_name` = '李四',
  `remark` = '电脑维修费用'
WHERE `order_no` = 'ORD20240324002';

UPDATE `cmms_online_payments` SET
  `customer_name` = '王五',
  `remark` = '服务器维护费用'
WHERE `order_no` = 'ORD20240324003';

UPDATE `cmms_online_payments` SET
  `customer_name` = '赵六',
  `remark` = '网络设备维修'
WHERE `order_no` = 'ORD20240323001';

UPDATE `cmms_online_payments` SET
  `customer_name` = '孙七',
  `remark` = '已退款'
WHERE `order_no` = 'ORD20240323002';

UPDATE `cmms_online_payments` SET
  `customer_name` = '周八',
  `remark` = '用户取消支付'
WHERE `order_no` = 'ORD20240322001';

UPDATE `cmms_online_payments` SET
  `customer_name` = '吴九',
  `remark` = '软件安装服务'
WHERE `order_no` = 'ORD20240322002';

UPDATE `cmms_online_payments` SET
  `customer_name` = '郑十',
  `remark` = '数据恢复服务'
WHERE `order_no` = 'ORD20240321001';

UPDATE `cmms_online_payments` SET
  `customer_name` = '钱十一',
  `remark` = '待支付'
WHERE `order_no` = 'ORD20240320001';

UPDATE `cmms_online_payments` SET
  `customer_name` = '陈十二',
  `remark` = '综合维修服务'
WHERE `order_no` = 'ORD20240320002';

-- 发票管理表数据修复
UPDATE `cmms_invoices` SET
  `company_name` = '上海机械制造有限公司',
  `address_phone` = '上海市浦东新区张江高科技园区 021-12345678',
  `bank_name` = '中国工商银行上海分行',
  `remark` = '设备维修费'
WHERE `invoice_no` = '01234567';

UPDATE `cmms_invoices` SET
  `company_name` = '北京建设集团',
  `address_phone` = '北京市朝阳区建国路88号 010-87654321',
  `bank_name` = '中国建设银行北京分行',
  `remark` = '配件销售'
WHERE `invoice_no` = '01234568';

UPDATE `cmms_invoices` SET
  `company_name` = '深圳物流有限公司',
  `remark` = '服务费'
WHERE `invoice_no` = '01234569';

UPDATE `cmms_invoices` SET
  `company_name` = '广州电子科技有限公司',
  `address_phone` = '广州市天河区科韵路 020-98765432',
  `bank_name` = '中国银行广州分行',
  `remark` = '系统开发服务'
WHERE `invoice_no` = '01234570';

UPDATE `cmms_invoices` SET
  `company_name` = '杭州网络服务公司',
  `address_phone` = '杭州市西湖区文三路 0571-13579086',
  `bank_name` = '招商银行杭州分行',
  `remark` = '网络维护费'
WHERE `invoice_no` = '01234571';

UPDATE `cmms_invoices` SET
  `company_name` = '成都数据中心',
  `remark` = '云服务费'
WHERE `invoice_no` = '01234572';

UPDATE `cmms_invoices` SET
  `company_name` = '武汉智能制造有限公司',
  `address_phone` = '武汉市东湖高新区光谷大道 027-24681357',
  `bank_name` = '交通银行武汉分行',
  `remark` = '智能制造系统'
WHERE `invoice_no` = '01234573';

UPDATE `cmms_invoices` SET
  `company_name` = '南京软件开发公司',
  `address_phone` = '南京市江宁区麒麟科技创新园 025-11223344',
  `bank_name` = '工商银行南京分行',
  `remark` = '软件定制开发'
WHERE `invoice_no` = '01234574';

SELECT '支付模块表数据修复完成！' AS message;
