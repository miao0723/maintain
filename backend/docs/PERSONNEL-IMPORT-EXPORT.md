# 人员管理批量导入/导出功能设计文档

## 1. 导出功能

### 1.1 导出格式
- **文件格式**: Excel (.xlsx)
- **文件名格式**: `人员数据_YYYYMMDD_HHMMSS.xlsx`

### 1.2 导出字段

| 列名 | 字段名 | 类型 | 说明 | 示例 |
|------|--------|------|------|------|
| 姓名 | name | 文本 | 人员真实姓名 | 张三 |
| 工号 | code | 文本 | 唯一员工编号 | PER001 |
| 部门 | department_name | 文本 | 所属部门名称 | 技术部 |
| 岗位 | position | 文本 | 岗位类型 | engineer |
| 手机号 | phone | 文本 | 11 位手机号码 | 13800138000 |
| 邮箱 | email | 文本 | 电子邮箱 | zhangsan@company.com |
| 入职日期 | entry_date | 日期 | YYYY-MM-DD 格式 | 2024-01-15 |
| 状态 | status | 文本 | 在职/离职 | 在职 |
| 备注 | notes | 文本 | 其他说明 | 高级开发工程师 |

### 1.3 岗位类型说明

| 岗位代码 | 岗位名称 |
|----------|----------|
| engineer | 工程师 |
| supervisor | 主管 |
| manager | 经理 |

### 1.4 状态说明

| 状态值 | 状态名称 |
|--------|----------|
| 1 | 在职 |
| 0 | 离职 |

---

## 2. 导入功能

### 2.1 支持格式
- **文件格式**: Excel (.xlsx) 或 CSV (.csv)
- **编码**: UTF-8 (CSV)

### 2.2 必填字段

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| name | 文本 | 人员姓名（必填） | 张三 |
| code | 文本 | 工号（必填，唯一） | PER001 |
| phone | 文本 | 手机号（必填） | 13800138000 |

### 2.3 选填字段

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| department_id | 数字 | 部门 ID（不填则为空） | 1 |
| department_name | 文本 | 部门名称（与 department_id 二选一） | 技术部 |
| position | 文本 | 岗位代码 | engineer |
| email | 文本 | 邮箱 | zhangsan@company.com |
| entry_date | 日期 | 入职日期 | 2024-01-15 |
| status | 数字 | 状态：1 在职，0 离职 | 1 |
| notes | 文本 | 备注 | 高级开发工程师 |

### 2.4 导入模板示例

```
name,code,phone,department_name,position,email,entry_date,status,notes
张三，PER001,13800138000，技术部，engineer,zhangsan@company.com,2024-01-15,1，高级开发工程师
李四，PER002,13800138001，技术部，engineer,lisi@company.com,2024-03-20,1，中级开发工程师
王五，PER003,13800138002，销售部，supervisor,wangwu@company.com,2023-06-01,1，销售主管
```

### 2.5 导入规则

1. **工号唯一性**: 工号不能与已有记录重复
2. **手机号格式**: 必须是 11 位中国大陆手机号
3. **邮箱格式**: 必须是有效的邮箱格式
4. **部门存在性**: 如果填写部门 ID 或部门名称，该部门必须存在
5. **岗位有效性**: position 只能是 engineer/supervisor/manager
6. **状态有效性**: status 只能是 0 或 1
7. **日期格式**: entry_date 必须是 YYYY-MM-DD 格式

### 2.6 错误处理

| 错误类型 | 错误提示 | 处理方式 |
|----------|----------|----------|
| 工号重复 | 工号{code}已存在 | 跳过该行 |
| 手机号格式错误 | 第{row}行手机号格式错误 | 跳过该行 |
| 邮箱格式错误 | 第{row}行邮箱格式错误 | 跳过该行 |
| 部门不存在 | 第{row}行部门{dept}不存在 | 跳过该行 |
| 缺少必填字段 | 第{row}行缺少必填字段{name/code/phone} | 跳过该行 |
| 岗位无效 | 第{row}行岗位{pos}无效 | 使用默认值 |

---

## 3. API 接口设计

### 3.1 导入接口

```
POST /api/personnel/import
Content-Type: multipart/form-data

参数:
- file: Excel 或 CSV 文件

返回:
{
    "code": 200,
    "message": "导入成功",
    "data": {
        "total": 10,        // 总行数
        "success": 8,       // 成功导入数量
        "failed": 2,        // 失败数量
        "errors": [         // 错误详情
            {
                "row": 3,
                "message": "工号 PER003 已存在"
            }
        ]
    }
}
```

### 3.2 导出接口

```
GET /api/personnel/export

查询参数（可选）:
- keyword: 搜索关键字
- department_id: 部门 ID
- position: 岗位
- status: 状态

返回: Excel 文件流
```

---

## 4. 测试数据模板

### 4.1 Excel 测试数据（5 条记录）

| name | code | phone | department_name | position | email | entry_date | status | notes |
|------|------|-------|-----------------|----------|-------|------------|--------|-------|
| 测试用户 1 | TEST001 | 13800138001 | 技术部 | engineer | test1@company.com | 2024-01-15 | 1 | 测试工程师 |
| 测试用户 2 | TEST002 | 13800138002 | 技术部 | engineer | test2@company.com | 2024-02-20 | 1 | 测试工程师 |
| 测试用户 3 | TEST003 | 13800138003 | 销售部 | supervisor | test3@company.com | 2024-03-10 | 1 | 销售主管 |
| 测试用户 4 | TEST004 | 13800138004 | 人事部 | manager | test4@company.com | 2024-04-05 | 1 | 人事经理 |
| 测试用户 5 | TEST005 | 13800138005 | 财务部 | engineer | test5@company.com | 2024-05-01 | 0 | 已离职 |

### 4.2 CSV 格式测试数据

```csv
name,code,phone,department_name,position,email,entry_date,status,notes
测试用户 1,TEST001,13800138001，技术部，engineer,test1@company.com,2024-01-15,1，测试工程师
测试用户 2,TEST002,13800138002，技术部，engineer,test2@company.com,2024-02-20,1，测试工程师
测试用户 3,TEST003,13800138003，销售部，supervisor,test3@company.com,2024-03-10,1，销售主管
测试用户 4,TEST004,13800138004，人事部，manager,test4@company.com,2024-04-05,1，人事经理
测试用户 5,TEST005,13800138005，财务部，engineer,test5@company.com,2024-05-01,0，已离职
```

---

## 5. 实现建议

### 5.1 后端依赖
```json
{
    "require": {
        "phpoffice/phpspreadsheet": "^1.29"
    }
}
```

### 5.2 前端组件
- 使用 Element Plus 的 `el-upload` 组件实现文件上传
- 使用 `xlsx` 库（SheetJS）可选，用于前端预览

### 5.3 文件上传限制
- 最大文件大小：10MB
- 支持格式：.xlsx, .xls, .csv
- 最大导入行数：1000 行

---

## 6. 注意事项

1. 导入前建议先下载模板，按照模板格式填写数据
2. 大批量导入时建议分批进行（每批不超过 500 条）
3. 导入操作建议在工作时间进行，避免影响系统性能
4. 重要数据导入前建议先备份数据库
5. 导入失败的数据可以下载错误报告，修正后重新导入
