<template>
  <div class="collections-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <el-input
        v-model="searchName"
        placeholder="搜索知识库..."
        prefix-icon="Search"
        clearable
        style="width: 300px"
        @clear="loadData"
        @keyup.enter="loadData"
      />
      <el-button type="primary" icon="Plus" @click="showCreateDialog">创建知识库</el-button>
    </div>

    <!-- 知识库卡片网格 -->
    <div v-loading="loading" class="card-grid">
      <el-empty v-if="!loading && collections.length === 0" description="暂无知识库，点击上方按钮创建" />

      <el-card
        v-for="item in collections"
        :key="item.id"
        class="kb-card"
        shadow="hover"
        @click="handleCardClick($event, item.id)"
      >
        <div class="card-header">
          <el-icon :size="32" color="#409EFF"><Reading /></el-icon>
          <el-dropdown class="card-menu" trigger="click" @command="handleCommand($event, item)">
            <span class="more-btn" @click.stop @mousedown.stop>
              <el-icon><MoreFilled /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">编辑</el-dropdown-item>
                <el-dropdown-item command="chat">AI 对话</el-dropdown-item>
                <el-dropdown-item command="delete" divided style="color: #F56C6C">删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <h3 class="card-title">{{ item.name }}</h3>
        <p class="card-desc">{{ item.description || '暂无描述' }}</p>
        <div class="card-stats">
          <span><el-icon><Document /></el-icon> {{ item.file_count }} 个文件</span>
          <span><el-icon><Collection /></el-icon> {{ item.chunk_count }} 个文本块</span>
        </div>
        <div class="card-footer">
          <span class="card-time">{{ item.created_at }}</span>
          <div class="card-actions">
            <el-button size="small" text type="primary" @click.stop="goToDetail(item.id)">查看文件</el-button>
            <el-button size="small" text type="success" @click.stop="goToChat(item.id)">AI 对话</el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrap" v-if="total > 0">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadData"
      />
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑知识库' : '创建知识库'" width="500px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入知识库名称" maxlength="100" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入知识库描述" maxlength="1000" />
        </el-form-item>
        <el-form-item label="状态" prop="status" v-if="editingId">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Reading, Document, Collection, MoreFilled } from '@element-plus/icons-vue'
import { getCollections, createCollection, updateCollection, deleteCollection } from '@/api/knowledge'

const router = useRouter()

const loading = ref(false)
const collections = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const searchName = ref('')

const dialogVisible = ref(false)
const editingId = ref(null)
const submitting = ref(false)
const formRef = ref(null)

const form = ref({
  name: '',
  description: '',
  status: 1
})

const formRules = {
  name: [{ required: true, message: '请输入知识库名称', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getCollections({
      page: page.value,
      pageSize: pageSize.value,
      name: searchName.value || undefined
    })
    collections.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    loading.value = false
  }
}

const showCreateDialog = () => {
  editingId.value = null
  form.value = { name: '', description: '', status: 1 }
  dialogVisible.value = true
}

const handleCommand = (command, item) => {
  if (command === 'edit') {
    editingId.value = item.id
    form.value = { name: item.name, description: item.description || '', status: item.status }
    dialogVisible.value = true
  } else if (command === 'chat') {
    router.push({ name: 'KbChat', query: { collection_id: item.id } })
  } else if (command === 'delete') {
    ElMessageBox.confirm(
      `确定要删除知识库「${item.name}」吗？此操作将同时删除所有文件和向量数据，不可恢复！`,
      '删除确认',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
    ).then(async () => {
      try {
        await deleteCollection(item.id)
        ElMessage.success('删除成功')
        loadData()
      } catch (e) {
        // 错误已处理
      }
    }).catch(() => {})
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (editingId.value) {
      await updateCollection(editingId.value, form.value)
      ElMessage.success('更新成功')
    } else {
      await createCollection(form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (e) {
    // 错误已处理
  } finally {
    submitting.value = false
  }
}

const handleCardClick = (event, id) => {
  const target = event.target
  if (target?.closest('.card-menu') || target?.closest('.card-actions')) {
    return
  }
  goToDetail(id)
}

const goToDetail = (id) => {
  router.push({ name: 'KbDetail', params: { id } })
}

const goToChat = (id) => {
  router.push({ name: 'KbChat', query: { collection_id: id } })
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.collections-page {
  position: relative;
  min-height: 100%;
  padding: 4px 4px 12px;

  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 180px;
    border-radius: 24px;
    background:
      radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 48%),
      linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.72));
    pointer-events: none;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    padding: 18px 20px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(16px);
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
    position: relative;
    z-index: 1;
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 22px;
    min-height: 200px;
    position: relative;
    z-index: 1;
  }

  .kb-card {
    position: relative;
    cursor: pointer;
    border: 1px solid rgba(148, 163, 184, 0.16);
    border-radius: 22px;
    overflow: hidden;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
    box-shadow: 0 18px 38px rgba(15, 23, 42, 0.06);
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at top right, rgba(96, 165, 250, 0.18), transparent 34%),
        linear-gradient(180deg, transparent, rgba(248, 250, 252, 0.32));
      pointer-events: none;
    }

    &:hover {
      transform: translateY(-6px);
      border-color: rgba(59, 130, 246, 0.26);
      box-shadow: 0 24px 48px rgba(37, 99, 235, 0.12);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      position: relative;
      z-index: 1;

      :deep(.el-icon:first-child) {
        width: 52px;
        height: 52px;
        border-radius: 16px;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(99, 102, 241, 0.18));
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
      }

      .more-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        cursor: pointer;
        color: #64748b;
        border-radius: 12px;
        transition: all 0.2s ease;

        .el-icon {
          font-size: 18px;
        }

        &:hover {
          color: #2563eb;
          background: rgba(37, 99, 235, 0.08);
        }
      }
    }

    .card-title {
      position: relative;
      z-index: 1;
      font-size: 17px;
      font-weight: 700;
      margin: 0 0 10px;
      color: #0f172a;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      letter-spacing: 0.01em;
    }

    .card-desc {
      position: relative;
      z-index: 1;
      font-size: 13px;
      color: #64748b;
      margin: 0 0 18px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 40px;
      line-height: 1.65;
    }

    .card-stats {
      position: relative;
      z-index: 1;
      flex-wrap: wrap;
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
      font-size: 13px;
      color: #475569;

      span {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 10px;
        border-radius: 999px;
        background: rgba(248, 250, 252, 0.92);
        border: 1px solid rgba(226, 232, 240, 0.9);
      }
    }

    .card-footer {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding-top: 14px;
      border-top: 1px solid rgba(226, 232, 240, 0.9);

      .card-time {
        font-size: 12px;
        color: #94a3b8;
      }

      .card-actions {
        display: flex;
        gap: 6px;
      }
    }
  }

  .pagination-wrap {
    display: flex;
    justify-content: center;
    margin-top: 24px;
    padding: 10px 0 4px;
    position: relative;
    z-index: 1;
  }

  :deep(.el-card__body) {
    position: relative;
    padding: 22px 22px 18px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 14px;
    background: rgba(248, 250, 252, 0.92);
    box-shadow: inset 0 0 0 1px rgba(226, 232, 240, 0.95);

    &.is-focus {
      box-shadow:
        inset 0 0 0 1px rgba(59, 130, 246, 0.95),
        0 0 0 4px rgba(59, 130, 246, 0.12);
    }
  }

  :deep(.el-button--primary:not(.is-text):not(.is-link)) {
    border: none;
    border-radius: 14px;
    background: linear-gradient(135deg, #2563eb, #4f46e5);
    box-shadow: 0 12px 24px rgba(37, 99, 235, 0.2);
  }

  // 查看文件/AI 对话等文字按钮：取消蓝色背景，仅保留字体颜色
  :deep(.card-actions .el-button.is-text) {
    background: transparent !important;
    border: none;
  }
  :deep(.card-actions .el-button.is-text.el-button--primary) {
    color: #2563eb;
  }
  :deep(.card-actions .el-button.is-text.el-button--success) {
    color: #047857;
  }

  :deep(.el-button--success.is-text) {
    color: #047857;
  }

  :deep(.el-dialog) {
    border-radius: 22px;
    overflow: hidden;
    box-shadow: 0 28px 60px rgba(15, 23, 42, 0.2);
  }

  :deep(.el-dialog__header) {
    padding-bottom: 8px;
  }

  :deep(.el-textarea__inner) {
    border-radius: 14px;
  }
}

@media (max-width: 768px) {
  .collections-page {
    .page-header {
      flex-direction: column;
      align-items: stretch;
      padding: 16px;
    }

    .card-grid {
      grid-template-columns: 1fr;
    }

    .kb-card {
      .card-footer {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  }
}
</style>
