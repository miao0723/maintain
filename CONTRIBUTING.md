# 贡献指南

感谢您考虑为CMMS系统做出贡献！本文档将指导您如何参与项目开发。

---

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request流程](#pull-request流程)

---

## 🤝 行为准则

### 我们的承诺

为了营造开放和友好的环境，我们承诺：
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

### 不可接受的行为

- 使用性化的语言或图像
- 人身攻击或政治攻击
- 公开或私下骚扰
- 未经许可发布他人私人信息
- 其他不道德或不专业的行为

---

## 🚀 如何贡献

### 报告Bug

1. 在Issues中搜索确认问题是否已存在
2. 如果没有，创建新Issue，包含以下信息：
   - 清晰的标题
   - 详细的Bug描述
   - 复现步骤
   - 预期行为
   - 实际行为
   - 环境信息（PHP版本、MySQL版本等）
   - 截图或日志（如果适用）

### 提出新功能

1. 在Issues中搜索确认功能是否已建议
2. 如果没有，创建新Issue，包含以下信息：
   - 清晰的功能描述
   - 使用场景
   - 可能的实现方案
   - 是否愿意参与开发

### 提交代码

1. Fork本仓库
2. 创建特性分支
3. 进行开发
4. 提交Pull Request

---

## 🔧 开发流程

### 环境准备

```bash
# 1. Fork并克隆仓库
git clone https://github.com/yourusername/cmms.git
cd cmms

# 2. 添加上游仓库
git remote add upstream https://github.com/original/cmms.git

# 3. 安装后端依赖
cd backend
composer install

# 4. 安装前端依赖
cd ../frontend-web
npm install

# 5. 配置环境
cd ../backend
cp .env.example .env
# 编辑.env文件

# 6. 初始化数据库
php migrate.php
php seed.php
```

### 分支策略

- `master` - 主分支，稳定版本
- `develop` - 开发分支
- `feature/*` - 功能分支
- `bugfix/*` - 修复分支
- `hotfix/*` - 紧急修复分支

### 开发流程

1. 从`develop`分支创建功能分支
```bash
git checkout develop
git pull upstream develop
git checkout -b feature/your-feature-name
```

2. 进行开发
- 遵循代码规范
- 编写单元测试
- 更新文档

3. 提交代码
```bash
git add .
git commit -m "feat: add your feature"
```

4. 推送到自己的仓库
```bash
git push origin feature/your-feature-name
```

5. 创建Pull Request

---

## 📝 代码规范

### PHP代码规范 (后端)

遵循 [PSR-12](https://www.php-fig.org/psr/psr-12/) 代码规范。

#### 命名规范

```php
// 类名：PascalCase
class WorkOrderService {}

// 方法名：camelCase
public function getWorkOrderList() {}

// 变量名：camelCase
$workOrderList = [];

// 常量名：UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
```

#### 注释规范

```php
/**
 * 获取工单列表
 *
 * @param array $params 查询参数
 * @return array 工单列表
 * @throws \Exception
 */
public function getWorkOrderList($params)
{
    // 实现代码
}
```

### Vue代码规范 (前端)

遵循 [Vue官方风格指南](https://cn.vuejs.org/v2/style-guide/)。

#### 组件命名

```javascript
// 组件文件名：PascalCase
// WorkOrderList.vue

export default {
  name: 'WorkOrderList' // PascalCase
}
```

#### 变量命名

```javascript
// 变量/函数：camelCase
const workOrderList = []
function getWorkOrderList() {}

// 常量：UPPER_SNAKE_CASE
const MAX_COUNT = 100

// 组件注册：PascalCase
components: {
  WorkOrderItem
}
```

### JavaScript通用规范

```javascript
// 使用const/let，避免var
const apiUrl = 'https://api.example.com'
let currentPage = 1

// 使用箭头函数
const getData = async () => {
  // ...
}

// 使用模板字符串
const message = `工单号：${orderNo}`
```

---

## 🎯 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 规范。

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type类型

- `feat`: 新功能
- `fix`: 修复Bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 重构（既不是新功能也不是修复）
- `perf`: 性能优化
- `test`: 添加测试
- `chore`: 构建过程或辅助工具的变动
- `revert`: 回滚之前的提交

### Scope范围

- `backend`: 后端
- `frontend`: Web前端
- `miniprogram`: 小程序
- `api`: API接口
- `database`: 数据库
- `docs`: 文档
- `auth`: 认证
- `workorder`: 工单模块
- `device`: 设备模块
- `engineer`: 工程师模块
- `inventory`: 库存模块
- 其他模块名称

### 示例

```bash
# 新功能
feat(backend): add work order statistics API

# 修复Bug
fix(frontend): resolve image upload crash

# 文档更新
docs: update deployment guide

# 性能优化
perf(backend): optimize N+1 query in work order list

# 重构
refactor(auth): simplify JWT token refresh logic
```

---

## 📥 Pull Request流程

### PR标题格式

使用与Commit相同的格式：

```
<type>(<scope>): <subject>
```

### PR描述模板

创建PR时请填写以下信息：

```markdown
## 变更类型
- [ ] 新功能
- [ ] Bug修复
- [ ] 性能优化
- [ ] 重构
- [ ] 文档更新
- [ ] 其他（请说明）

## 变更说明
<!-- 描述本次PR的主要变更内容 -->

## 相关Issue
<!-- 关联的Issue编号，如：Fixes #123 -->

## 测试
<!-- 说明如何测试本次变更 -->

- [ ] 单元测试通过
- [ ] 手动测试通过
- [ ] 添加了新的测试用例

## 截图
<!-- 如果是UI变更，请提供截图 -->

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 已添加必要的注释
- [ ] 已更新相关文档
- [ ] 测试已通过
- [ ] 无Merge冲突
```

### PR审查流程

1. **自动检查**
   - CI/CD自动测试
   - 代码风格检查
   - 安全扫描

2. **人工审查**
   - 代码质量审查
   - 功能测试
   - 性能评估

3. **反馈与修改**
   - 根据反馈进行修改
   - 更新PR

4. **合并**
   - 审查通过后合并
   - 删除特性分支

---

## 🐛 Bug修复优先级

- **P0 - 紧急**: 系统崩溃、数据丢失、安全漏洞
- **P1 - 高**: 主要功能不可用
- **P2 - 中**: 影响部分功能，有绕过方案
- **P3 - 低**: 小问题，不影响使用

---

## 📚 开发资源

### 技术文档

- [ThinkPHP 8.1文档](https://www.thinkphp.cn/)
- [Vue 3文档](https://cn.vuejs.org/)
- [Element Plus文档](https://element-plus.org/)
- [微信小程序文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)

### 工具推荐

- **IDE**: PhpStorm / VS Code
- **API测试**: Postman / Insomnia
- **数据库管理**: Navicat / DBeaver
- **版本控制**: Git / GitHub Desktop
- **接口调试**: Chrome DevTools

---

## 💬 讨论与交流

### 微信群

扫描二维码加入CMMS开发者交流群：

<!-- TODO: 添加群二维码 -->

### 邮件列表

发送邮件至：dev@cmms.example.com

### Issue讨论

在GitHub Issues中：
1. 使用合适的标签
2. 提供详细信息
3. 及时回复反馈

---

## 🙏 致谢

感谢所有为CMMS项目做出贡献的开发者！

---

## 📄 许可证

贡献的代码将采用项目的 [MIT许可证](LICENSE)。
