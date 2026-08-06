<template>
  <div class="mini-page">
    <el-card shadow="never">
      <div class="page-header">
        <div>
          <h2>{{ pageConfig.title }}</h2>
          <p>{{ pageConfig.description }}</p>
        </div>
        <div class="page-actions">
          <el-button @click="handleReset">重置</el-button>
          <el-button v-if="pageConfig.allowCreate" type="primary" @click="openCreate">新增</el-button>
        </div>
      </div>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item
          v-for="field in pageConfig.filters"
          :key="field.prop"
          :label="field.label"
        >
          <el-input
            v-if="!field.type || field.type === 'text'"
            v-model="searchForm[field.prop]"
            :placeholder="field.placeholder"
            clearable
            @keyup.enter="loadData"
          />
          <el-input-number
            v-else-if="field.type === 'number'"
            v-model="searchForm[field.prop]"
            :min="field.min ?? 0"
            :controls="false"
            :placeholder="field.placeholder"
          />
          <el-select
            v-else-if="field.type === 'select'"
            v-model="searchForm[field.prop]"
            :placeholder="field.placeholder"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="option in field.options"
              :key="String(option.value)"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column
          v-for="column in pageConfig.columns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :show-overflow-tooltip="column.ellipsis !== false"
        >
          <template #default="{ row }">
            <el-tag
              v-if="column.type === 'boolean-tag'"
              :type="Number(row[column.prop]) === 1 ? 'success' : 'info'"
            >
              {{ Number(row[column.prop]) === 1 ? '是' : '否' }}
            </el-tag>
            <span v-else-if="column.type === 'icon-text'" class="icon-cell">{{ row[column.prop] || '-' }}</span>
            <span v-else>{{ formatCell(row, column) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button
              v-if="pageConfig.allowDelete"
              link
              type="danger"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="loadData"
        @size-change="handleSizeChange"
      />
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? `新增${pageConfig.title}` : `编辑${pageConfig.title}`"
      width="720px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="formData" :rules="pageConfig.rules" label-width="110px">
        <el-form-item
          v-for="field in pageConfig.formFields"
          :key="field.prop"
          :label="field.label"
          :prop="field.prop"
        >
          <el-input
            v-if="!field.type || field.type === 'text'"
            v-model="formData[field.prop]"
            :placeholder="field.placeholder"
            :maxlength="field.maxlength"
          />
          <el-input
            v-else-if="field.type === 'textarea'"
            v-model="formData[field.prop]"
            :placeholder="field.placeholder"
            type="textarea"
            :rows="field.rows || 4"
          />
          <el-input-number
            v-else-if="field.type === 'number'"
            v-model="formData[field.prop]"
            :min="field.min ?? 0"
            :max="field.max"
            :precision="field.precision"
            style="width: 100%"
          />
          <el-select
            v-else-if="field.type === 'select'"
            v-model="formData[field.prop]"
            :placeholder="field.placeholder"
            style="width: 100%"
          >
            <el-option
              v-for="option in field.options"
              :key="String(option.value)"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-switch
            v-else-if="field.type === 'switch'"
            v-model="formData[field.prop]"
            :active-value="field.activeValue ?? 1"
            :inactive-value="field.inactiveValue ?? 0"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createMiniAdminResource,
  deleteMiniAdminResource,
  getMiniAdminResourceDetail,
  getMiniAdminResourceList,
  updateMiniAdminResource
} from '@/api/miniAdmin'

const route = useRoute()
const formRef = ref(null)
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const dialogMode = ref('create')
const tableData = ref([])
const searchForm = reactive({})
const formData = reactive({})
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const resourceConfigs = {
  addresses: {
    title: '地址管理',
    description: '直连 repair.user_addresses，支持地址主数据增删改查。',
    resource: 'addresses',
    allowCreate: true,
    allowDelete: true,
    filters: [
      { prop: 'keyword', label: '关键词', placeholder: '联系人/电话/地址' },
      { prop: 'user_id', label: '用户ID', type: 'number', placeholder: '用户ID' }
    ],
    columns: [
      { prop: 'id', label: 'ID', width: 80, ellipsis: false },
      { prop: 'user_id', label: '用户ID', width: 90, ellipsis: false },
      { prop: 'contact_name', label: '联系人', minWidth: 120 },
      { prop: 'contact_phone', label: '联系电话', minWidth: 140 },
      { prop: 'province', label: '省', width: 100 },
      { prop: 'city', label: '市', width: 100 },
      { prop: 'district', label: '区', width: 100 },
      { prop: 'detail_address', label: '详细地址', minWidth: 220 },
      { prop: 'is_default', label: '默认', width: 80, type: 'boolean-tag' }
    ],
    formFields: [
      { prop: 'user_id', label: '用户ID', type: 'number', min: 1 },
      { prop: 'contact_name', label: '联系人', placeholder: '请输入联系人姓名' },
      { prop: 'contact_phone', label: '联系电话', placeholder: '请输入联系电话' },
      { prop: 'province', label: '省份', placeholder: '请输入省份' },
      { prop: 'city', label: '城市', placeholder: '请输入城市' },
      { prop: 'district', label: '区县', placeholder: '请输入区县' },
      { prop: 'detail_address', label: '详细地址', type: 'textarea', rows: 3, placeholder: '请输入详细地址' },
      { prop: 'postal_code', label: '邮编', placeholder: '请输入邮政编码' },
      { prop: 'tags', label: '标签', placeholder: '如：公司/家/仓库' },
      { prop: 'is_default', label: '默认地址', type: 'switch', activeValue: 1, inactiveValue: 0 }
    ],
    defaults: {
      user_id: 1,
      contact_name: '',
      contact_phone: '',
      province: '',
      city: '',
      district: '',
      detail_address: '',
      postal_code: '',
      tags: '',
      is_default: 0
    },
    rules: {
      user_id: [{ required: true, message: '请输入用户ID', trigger: 'blur' }],
      contact_name: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
      contact_phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
    }
  },
  units: {
    title: '单位管理',
    description: '直连 repair.user_units，维护用户单位与默认单位信息。',
    resource: 'units',
    allowCreate: true,
    allowDelete: true,
    filters: [
      { prop: 'keyword', label: '关键词', placeholder: '单位/联系人/电话' },
      { prop: 'user_id', label: '用户ID', type: 'number', placeholder: '用户ID' }
    ],
    columns: [
      { prop: 'id', label: 'ID', width: 80, ellipsis: false },
      { prop: 'user_id', label: '用户ID', width: 90, ellipsis: false },
      { prop: 'name', label: '单位名称', minWidth: 180 },
      { prop: 'address', label: '单位地址', minWidth: 220 },
      { prop: 'contact_name', label: '联系人', width: 120 },
      { prop: 'contact_phone', label: '联系电话', width: 140 },
      { prop: 'is_default', label: '默认', width: 80, type: 'boolean-tag' }
    ],
    formFields: [
      { prop: 'user_id', label: '用户ID', type: 'number', min: 1 },
      { prop: 'name', label: '单位名称', placeholder: '请输入单位名称' },
      { prop: 'address', label: '单位地址', type: 'textarea', rows: 3, placeholder: '请输入单位地址' },
      { prop: 'contact_name', label: '联系人', placeholder: '请输入联系人' },
      { prop: 'contact_phone', label: '联系电话', placeholder: '请输入联系电话' },
      { prop: 'is_default', label: '默认单位', type: 'switch', activeValue: 1, inactiveValue: 0 }
    ],
    defaults: {
      user_id: 1,
      name: '',
      address: '',
      contact_name: '',
      contact_phone: '',
      is_default: 0
    },
    rules: {
      user_id: [{ required: true, message: '请输入用户ID', trigger: 'blur' }],
      name: [{ required: true, message: '请输入单位名称', trigger: 'blur' }]
    }
  },
  brands: {
    title: '品牌管理',
    description: '维护小程序品牌字典，直接写入 repair.brands。',
    resource: 'brands',
    allowCreate: true,
    allowDelete: true,
    filters: [
      { prop: 'keyword', label: '关键词', placeholder: '品牌名称' }
    ],
    columns: [
      { prop: 'id', label: 'ID', width: 80, ellipsis: false },
      { prop: 'name', label: '品牌名称', minWidth: 220 },
      { prop: 'created_at', label: '创建时间', minWidth: 180 }
    ],
    formFields: [
      { prop: 'name', label: '品牌名称', placeholder: '请输入品牌名称' }
    ],
    defaults: {
      name: ''
    },
    rules: {
      name: [{ required: true, message: '请输入品牌名称', trigger: 'blur' }]
    }
  },
  'device-types': {
    title: '设备类型',
    description: '维护小程序设备类型字典，影响常见问题与下单选择项。',
    resource: 'device-types',
    allowCreate: true,
    allowDelete: true,
    filters: [
      { prop: 'keyword', label: '关键词', placeholder: '设备类型名称' }
    ],
    columns: [
      { prop: 'id', label: 'ID', width: 80, ellipsis: false },
      { prop: 'icon', label: '图标', width: 80, type: 'icon-text', ellipsis: false },
      { prop: 'name', label: '设备类型名称', minWidth: 220 },
      { prop: 'created_at', label: '创建时间', minWidth: 180 }
    ],
    formFields: [
      { prop: 'name', label: '设备类型名称', placeholder: '请输入设备类型名称' },
      { prop: 'icon', label: '图标', placeholder: '请输入 emoji 图标，如：📱' }
    ],
    defaults: {
      name: '',
      icon: '🔧'
    },
    rules: {
      name: [{ required: true, message: '请输入设备类型名称', trigger: 'blur' }]
    }
  },
  configs: {
    title: '系统配置',
    description: '配置项直接维护 repair.system_config，仅提供新增和编辑。',
    resource: 'configs',
    allowCreate: true,
    allowDelete: false,
    filters: [
      { prop: 'keyword', label: '关键词', placeholder: '配置键/说明' }
    ],
    columns: [
      { prop: 'id', label: 'ID', width: 80, ellipsis: false },
      { prop: 'config_key', label: '配置键', minWidth: 220 },
      { prop: 'config_value', label: '配置值', minWidth: 260 },
      { prop: 'description', label: '说明', minWidth: 220 },
      { prop: 'updated_at', label: '更新时间', minWidth: 180 }
    ],
    formFields: [
      { prop: 'config_key', label: '配置键', placeholder: '请输入配置键' },
      { prop: 'config_value', label: '配置值', type: 'textarea', rows: 5, placeholder: '请输入配置值' },
      { prop: 'description', label: '说明', type: 'textarea', rows: 3, placeholder: '请输入说明' }
    ],
    defaults: {
      config_key: '',
      config_value: '',
      description: ''
    },
    rules: {
      config_key: [{ required: true, message: '请输入配置键', trigger: 'blur' }],
      config_value: [{ required: true, message: '请输入配置值', trigger: 'blur' }]
    }
  }
}

const pageConfig = computed(() => {
  const config = resourceConfigs[route.meta.resource]
  return config || resourceConfigs.brands
})

const setReactiveData = (target, source) => {
  Object.keys(target).forEach(key => {
    delete target[key]
  })
  Object.assign(target, source)
}

const buildSearchDefaults = () => {
  const defaults = {}
  for (const field of pageConfig.value.filters) {
    defaults[field.prop] = field.type === 'number' ? null : ''
  }
  return defaults
}

const buildFormDefaults = () => ({ ...pageConfig.value.defaults })

const formatCell = (row, column) => {
  const value = row[column.prop]
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return value
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    Object.entries(searchForm).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        params[key] = value
      }
    })

    const res = await getMiniAdminResourceList(pageConfig.value.resource, params)
    tableData.value = res.data?.items || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    ElMessage.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  pagination.page = 1
  setReactiveData(searchForm, buildSearchDefaults())
  loadData()
}

const handleSizeChange = (size) => {
  pagination.page = 1
  pagination.pageSize = size
  loadData()
}

const openCreate = () => {
  dialogMode.value = 'create'
  setReactiveData(formData, buildFormDefaults())
  dialogVisible.value = true
}

const openEdit = async (row) => {
  dialogMode.value = 'edit'
  try {
    const res = await getMiniAdminResourceDetail(pageConfig.value.resource, row.id)
    setReactiveData(formData, {
      ...buildFormDefaults(),
      ...(res.data || {})
    })
    dialogVisible.value = true
  } catch (error) {
    ElMessage.error(error.message || '加载详情失败')
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }

  saving.value = true
  try {
    if (dialogMode.value === 'create') {
      await createMiniAdminResource(pageConfig.value.resource, formData)
      ElMessage.success('创建成功')
    } else {
      await updateMiniAdminResource(pageConfig.value.resource, formData.id, formData)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除该${pageConfig.value.title}记录吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await deleteMiniAdminResource(pageConfig.value.resource, row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

watch(
  () => route.meta.resource,
  () => {
    pagination.page = 1
    pagination.pageSize = 20
    setReactiveData(searchForm, buildSearchDefaults())
    setReactiveData(formData, buildFormDefaults())
    tableData.value = []
    loadData()
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.mini-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 20px;
      color: #0f172a;
    }

    p {
      margin: 8px 0 0;
      color: #64748b;
    }
  }

  .page-actions {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .search-form {
    margin-bottom: 16px;
  }

  .icon-cell {
    font-size: 22px;
    line-height: 1;
  }

  .el-pagination {
    margin-top: 16px;
    justify-content: flex-end;
  }
}
</style>
