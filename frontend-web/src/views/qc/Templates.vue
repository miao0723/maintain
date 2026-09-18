<template>
  <div class="qc-templates-page">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon>
        新建质检模板
      </el-button>
    </div>

    <!-- 模板列表 -->
    <el-table v-loading="loading" :data="tableData" border stripe>
      <el-table-column prop="name" label="模板名称" min-width="160" fixed />
      <el-table-column label="适用设备类型" width="130">
        <template #default="{ row }">{{ deviceTypeText(row.device_type_id) }}</template>
      </el-table-column>
      <el-table-column prop="item_count" label="质检项" width="80" align="center" />
      <el-table-column prop="grade_count" label="成色档位" width="90" align="center" />
      <el-table-column prop="order_count" label="已用质检单" width="100" align="center" />
      <el-table-column label="当前版本" width="140">
        <template #default="{ row }">
          <el-tag v-if="row.current_version" type="success" size="small">{{ row.current_version.version_no }}（生效中）</el-tag>
          <el-tag v-else type="info" size="small">未发布</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status ? 'success' : 'info'" size="small">{{ row.status ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="说明" min-width="140" show-overflow-tooltip>
        <template #default="{ row }">{{ row.description || '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.id)">配置</el-button>
          <el-button link @click="toggleStatus(row)">{{ row.status ? '停用' : '启用' }}</el-button>
          <el-button link type="danger" @click="removeTemplate(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.limit"
      :total="pagination.total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadData"
      @current-change="loadData"
    />

    <!-- 新建/编辑模板 -->
    <el-dialog v-model="editVisible" :title="editForm.id ? '编辑模板' : '新建质检模板'" width="520px">
      <el-form label-width="100px">
        <el-form-item label="模板名称" required>
          <el-input v-model="editForm.name" placeholder="如：手机回收质检标准" />
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="editForm.device_type_id" placeholder="通用（不限设备类型）" clearable style="width: 100%">
            <el-option
              v-for="dt in deviceTypes"
              :key="dt.id"
              :label="`${dt.icon || '🔧'} ${dt.name}`"
              :value="dt.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="editForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 模板配置抽屉：质检项 / 成色标准 / 版本 -->
    <el-drawer v-model="detailVisible" :title="`模板配置：${detail?.name || ''}`" size="72%">
      <template v-if="detail">
        <!-- 质检项 -->
        <div class="drawer-section">
          <div class="section-head">
            <h4>质检项</h4>
            <el-button type="primary" size="small" @click="openItemDialog()">添加质检项</el-button>
          </div>
          <el-table :data="detail.items" border size="small">
            <el-table-column prop="name" label="名称" min-width="120" />
            <el-table-column prop="category" label="分类" width="90">
              <template #default="{ row }">{{ row.category || '-' }}</template>
            </el-table-column>
            <el-table-column prop="check_method" label="检查方式" width="100">
              <template #default="{ row }">{{ row.check_method || '-' }}</template>
            </el-table-column>
            <el-table-column label="评分方式" width="90" align="center">
              <template #default="{ row }">{{ row.scoring_type === 'score' ? '打分' : '通过/不通过' }}</template>
            </el-table-column>
            <el-table-column label="故障标签" min-width="150">
              <template #default="{ row }">
                <el-tag v-for="f in row.fault_options || []" :key="f" size="small" class="fault-tag">{{ f }}</el-tag>
                <span v-if="!(row.fault_options || []).length">-</span>
              </template>
            </el-table-column>
            <el-table-column label="必检" width="60" align="center">
              <template #default="{ row }">{{ row.required ? '是' : '否' }}</template>
            </el-table-column>
            <el-table-column prop="sort_order" label="排序" width="60" align="center" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openItemDialog(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="removeItem(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 成色/故障标准 -->
        <div class="drawer-section">
          <div class="section-head">
            <h4>成色 / 故障定级标准</h4>
            <el-button type="primary" size="small" @click="openGradeDialog()">添加成色档位</el-button>
          </div>
          <el-table :data="detail.grades" border size="small">
            <el-table-column label="成色" width="120">
              <template #default="{ row }">
                <el-tag :type="conditionType(row.grade_key)">{{ row.grade_name }}（{{ conditionText(row.grade_key) }}）</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="分数区间" width="130" align="center">
              <template #default="{ row }">{{ row.min_score }} - {{ row.max_score }}</template>
            </el-table-column>
            <el-table-column label="回收价系数" width="100" align="center">
              <template #default="{ row }">{{ row.price_coefficient }}</template>
            </el-table-column>
            <el-table-column prop="fault_standard" label="故障 / 成色判定标准" min-width="220" show-overflow-tooltip />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openGradeDialog(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="removeGrade(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 版本管理 -->
        <div class="drawer-section">
          <div class="section-head">
            <h4>标准版本</h4>
            <el-button type="success" size="small" @click="openPublish">发布新版本</el-button>
          </div>
          <el-table :data="detail.versions" border size="small" empty-text="尚未发布过版本（质检单创建时将无标准可用，请先发布）">
            <el-table-column prop="version_no" label="版本" width="90" />
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                  {{ row.status === 'active' ? '生效中' : '已归档' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="changelog" label="变更说明" min-width="200">
              <template #default="{ row }">{{ row.changelog || '-' }}</template>
            </el-table-column>
            <el-table-column prop="published_at" label="发布时间" width="160" />
          </el-table>
        </div>
      </template>
    </el-drawer>

    <!-- 质检项编辑 -->
    <el-dialog v-model="itemVisible" :title="itemForm.id ? '编辑质检项' : '添加质检项'" width="520px">
      <el-form label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="itemForm.name" placeholder="如：屏幕显示" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="itemForm.category" placeholder="如：屏幕 / 外观 / 功能 / 电池" />
        </el-form-item>
        <el-form-item label="检查方式">
          <el-input v-model="itemForm.check_method" placeholder="目测 / 功能测试 / 仪器检测" />
        </el-form-item>
        <el-form-item label="评分方式">
          <el-select v-model="itemForm.scoring_type" style="width: 100%">
            <el-option label="通过 / 不通过" value="pass_fail" />
            <el-option label="打分（0-10）" value="score" />
          </el-select>
        </el-form-item>
        <el-form-item label="故障标签">
          <el-select v-model="itemForm.fault_options" multiple filterable allow-create default-first-option placeholder="输入后回车添加，如：花屏/漏液/划痕" style="width: 100%" />
        </el-form-item>
        <el-form-item label="必检">
          <el-switch v-model="itemForm.required" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="itemForm.sort_order" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="itemVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitItem">保存</el-button>
      </template>
    </el-dialog>

    <!-- 成色标准编辑 -->
    <el-dialog v-model="gradeVisible" :title="gradeForm.id ? '编辑成色档位' : '添加成色档位'" width="520px">
      <el-form label-width="110px">
        <el-form-item label="成色键" required>
          <el-select v-model="gradeForm.grade_key" :disabled="!!gradeForm.id" style="width: 100%">
            <el-option label="good（优）" value="good" />
            <el-option label="normal（良）" value="normal" />
            <el-option label="fair（中）" value="fair" />
            <el-option label="poor（差）" value="poor" />
          </el-select>
        </el-form-item>
        <el-form-item label="成色名称">
          <el-input v-model="gradeForm.grade_name" placeholder="如：九成新" />
        </el-form-item>
        <el-form-item label="分数区间">
          <el-input-number v-model="gradeForm.min_score" :min="0" :max="100" />&nbsp;至&nbsp;
          <el-input-number v-model="gradeForm.max_score" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="回收价系数">
          <el-input-number v-model="gradeForm.price_coefficient" :min="0" :max="1.5" :step="0.05" :precision="2" />
          <span class="tip">定级建议价 = 订单基准价 × 系数</span>
        </el-form-item>
        <el-form-item label="判定标准">
          <el-input v-model="gradeForm.fault_standard" type="textarea" :rows="3" placeholder="如：轻微划痕不超过2处，无功能故障" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="gradeVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitGrade">保存</el-button>
      </template>
    </el-dialog>

    <!-- 发布版本 -->
    <el-dialog v-model="publishVisible" title="发布新版本" width="480px">
      <el-alert type="warning" :closable="false" style="margin-bottom: 12px"
        title="发布将快照当前的质检项与成色标准，历史版本自动归档且只读；已创建的质检单仍使用其创建时的版本。" />
      <el-input v-model="publishChangelog" type="textarea" :rows="3" placeholder="变更说明，如：新增电池健康检查项" />
      <template #footer>
        <el-button @click="publishVisible = false">取消</el-button>
        <el-button type="success" :loading="submitLoading" @click="submitPublish">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getMiniAdminCommonProblemDeviceTypes } from '@/api/miniAdmin'
import {
  createQcGrade,
  createQcItem,
  createQcTemplate,
  deleteQcGrade,
  deleteQcItem,
  deleteQcTemplate,
  getQcTemplateDetail,
  getQcTemplates,
  publishQcVersion,
  updateQcGrade,
  updateQcItem,
  updateQcTemplate
} from '@/api/qc'

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])
const deviceTypes = ref([])
const pagination = reactive({ page: 1, limit: 15, total: 0 })

const conditionText = (c) => ({ good: '优', normal: '良', fair: '中', poor: '差' }[c] || c || '-')
const conditionType = (c) => ({ good: 'success', normal: 'primary', fair: 'warning', poor: 'danger' }[c] || 'info')
const deviceTypeText = (id) => {
  if (!id) return '通用'
  const found = deviceTypes.value.find((dt) => dt.id === Number(id))
  return found ? found.name : `类型#${id}`
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getQcTemplates({ page: pagination.page, page_size: pagination.limit })
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const fetchDeviceTypes = async () => {
  try {
    const res = await getMiniAdminCommonProblemDeviceTypes()
    deviceTypes.value = res.data || []
  } catch (e) { console.warn(e) }
}

// ============ 模板 ============
const editVisible = ref(false)
const editForm = reactive({ id: null, name: '', device_type_id: '', description: '' })

const openCreate = () => {
  Object.assign(editForm, { id: null, name: '', device_type_id: '', description: '' })
  editVisible.value = true
}

const submitEdit = async () => {
  if (!editForm.name.trim()) {
    ElMessage.warning('请填写模板名称')
    return
  }
  submitLoading.value = true
  try {
    const payload = { ...editForm, device_type_id: editForm.device_type_id || null }
    if (editForm.id) {
      await updateQcTemplate(editForm.id, payload)
    } else {
      await createQcTemplate(payload)
    }
    ElMessage.success('已保存')
    editVisible.value = false
    loadData()
  } catch (e) {
    console.error(e)
  } finally {
    submitLoading.value = false
  }
}

const toggleStatus = async (row) => {
  try {
    await updateQcTemplate(row.id, { status: row.status ? 0 : 1 })
    ElMessage.success(row.status ? '已停用' : '已启用')
    loadData()
  } catch (e) { console.error(e) }
}

const removeTemplate = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除模板「${row.name}」？`, '提示', { type: 'warning' })
    await deleteQcTemplate(row.id)
    ElMessage.success('已删除')
    loadData()
  } catch (e) { /* 取消或失败 */ }
}

// ============ 模板配置 ============
const detailVisible = ref(false)
const detail = ref(null)

const openDetail = async (id) => {
  const res = await getQcTemplateDetail(id)
  detail.value = res.data
  detailVisible.value = true
}

const refreshDetail = async () => {
  const res = await getQcTemplateDetail(detail.value.id)
  detail.value = res.data
}

// 质检项
const itemVisible = ref(false)
const itemForm = reactive({ id: null, name: '', category: '', check_method: '', scoring_type: 'pass_fail', fault_options: [], required: true, sort_order: 0 })

const openItemDialog = (row) => {
  if (row) {
    Object.assign(itemForm, {
      id: row.id,
      name: row.name,
      category: row.category || '',
      check_method: row.check_method || '',
      scoring_type: row.scoring_type,
      fault_options: row.fault_options || [],
      required: !!row.required,
      sort_order: row.sort_order || 0
    })
  } else {
    Object.assign(itemForm, { id: null, name: '', category: '', check_method: '', scoring_type: 'pass_fail', fault_options: [], required: true, sort_order: 0 })
  }
  itemVisible.value = true
}

const submitItem = async () => {
  if (!itemForm.name.trim()) {
    ElMessage.warning('请填写质检项名称')
    return
  }
  submitLoading.value = true
  try {
    if (itemForm.id) {
      await updateQcItem(itemForm.id, { ...itemForm })
    } else {
      await createQcItem(detail.value.id, { ...itemForm })
    }
    ElMessage.success('已保存')
    itemVisible.value = false
    refreshDetail()
    loadData()
  } catch (e) {
    console.error(e)
  } finally {
    submitLoading.value = false
  }
}

const removeItem = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除质检项「${row.name}」？`, '提示', { type: 'warning' })
    await deleteQcItem(row.id)
    refreshDetail()
    loadData()
  } catch (e) { /* 取消或失败 */ }
}

// 成色标准
const gradeVisible = ref(false)
const gradeForm = reactive({ id: null, grade_key: 'good', grade_name: '', min_score: 0, max_score: 100, price_coefficient: 1, fault_standard: '' })

const openGradeDialog = (row) => {
  if (row) {
    Object.assign(gradeForm, {
      id: row.id,
      grade_key: row.grade_key,
      grade_name: row.grade_name,
      min_score: Number(row.min_score),
      max_score: Number(row.max_score),
      price_coefficient: Number(row.price_coefficient),
      fault_standard: row.fault_standard || ''
    })
  } else {
    Object.assign(gradeForm, { id: null, grade_key: 'good', grade_name: '', min_score: 0, max_score: 100, price_coefficient: 1, fault_standard: '' })
  }
  gradeVisible.value = true
}

const submitGrade = async () => {
  submitLoading.value = true
  try {
    if (gradeForm.id) {
      await updateQcGrade(gradeForm.id, { ...gradeForm })
    } else {
      await createQcGrade(detail.value.id, { ...gradeForm })
    }
    ElMessage.success('已保存')
    gradeVisible.value = false
    refreshDetail()
    loadData()
  } catch (e) {
    console.error(e)
  } finally {
    submitLoading.value = false
  }
}

const removeGrade = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除成色档位「${row.grade_name}」？`, '提示', { type: 'warning' })
    await deleteQcGrade(row.id)
    refreshDetail()
    loadData()
  } catch (e) { /* 取消或失败 */ }
}

// 版本发布
const publishVisible = ref(false)
const publishChangelog = ref('')

const openPublish = () => {
  publishChangelog.value = ''
  publishVisible.value = true
}

const submitPublish = async () => {
  submitLoading.value = true
  try {
    await publishQcVersion(detail.value.id, publishChangelog.value)
    ElMessage.success('版本已发布')
    publishVisible.value = false
    refreshDetail()
    loadData()
  } catch (e) {
    console.error(e)
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  loadData()
  fetchDeviceTypes()
})
</script>

<style lang="scss" scoped>
.qc-templates-page {
  .toolbar {
    margin-bottom: 16px;
  }

  .el-pagination {
    margin-top: 16px;
    justify-content: flex-end;
  }

  .drawer-section {
    margin-bottom: 24px;

    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;

      h4 {
        margin: 0;
        font-size: 15px;
      }
    }
  }

  .fault-tag {
    margin-right: 4px;
  }

  .tip {
    margin-left: 10px;
    font-size: 12px;
    color: #909399;
  }
}
</style>
