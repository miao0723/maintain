<template>
<div class="page">
<div class="hero">
<div class="hero-content">
<p>抖音获客中心</p>
<h2>视频创作 · 素材库 · 流量分析</h2>
<span>创建视频后可直接保存到素材库，支持一键优化视频包装。</span>
</div>
<div class="stats">
<div class="box"><small>素材总数</small><b>{{ tableData.length }}</b></div>
<div class="box"><small>总播放量</small><b>{{ formatNumber(totalViews) }}</b></div>
<div class="box"><small>已发布</small><b>{{ publishedCount }}</b></div>
</div>
</div>

<el-tabs v-model="activeTab">
<el-tab-pane label="创建抖音视频" name="creator">
<div class="grid two">
<el-card shadow="never">
<template #header><div class="hd"><span>视频生成参数</span><el-tag type="warning">工作流</el-tag></div></template>
<el-alert title="已把创建视频请求超时延长到 180 秒，高级参数均可选，不填会自动使用默认值。" type="info" :closable="false" />
<el-form ref="generatorFormRef" :model="generatorForm" :rules="generatorRules" label-position="top">

<!-- 基础参数 -->
<div class="form-section">
<h4 class="section-title">基础参数</h4>
<el-form-item label="视频创意描述" prop="prompt">
<el-input v-model="generatorForm.prompt" type="textarea" :rows="4" placeholder="描述你想制作的视频内容，例如：展示我们的维修师傅快速上门服务，专业设备检测，透明报价流程" />
</el-form-item>
<div class="grid cols2">
<el-form-item label="清晰度" prop="resolution">
<el-select v-model="generatorForm.resolution" placeholder="选择视频清晰度">
<el-option label="720P - 标清" value="720p" />
<el-option label="1080P - 高清" value="1080p" />
<el-option label="2K - 超清" value="2k" />
</el-select>
</el-form-item>
<el-form-item label="画面比例" prop="ratio">
<el-select v-model="generatorForm.ratio" placeholder="选择画面比例">
<el-option label="竖屏 9:16（抖音/快手）" value="9:16" />
<el-option label="方屏 1:1（小红书）" value="1:1" />
<el-option label="横屏 16:9（西瓜/B站）" value="16:9" />
</el-select>
</el-form-item>
</div>
<div class="grid cols2">
<el-form-item label="视频时长" prop="duration">
<div class="duration-input">
<el-input-number v-model="generatorForm.duration" :min="5" :max="180" :step="5" style="width:100%" />
<span class="duration-tip">秒</span>
</div>
</el-form-item>
<el-form-item label="添加水印">
<el-switch v-model="generatorForm.watermark" inline-prompt active-text="开" inactive-text="关" />
</el-form-item>
</div>
</div>

<!-- 抖音发布信息 -->
<div class="form-section">
<h4 class="section-title">抖音发布信息</h4>
<el-form-item label="抖音标题" prop="douyin_title">
<el-input v-model="generatorForm.douyin_title" placeholder="例如：设备坏了别慌，师傅30分钟快速上门！" maxlength="100" show-word-limit />
</el-form-item>
<el-form-item label="抖音描述">
<el-input v-model="generatorForm.douyin_desc" type="textarea" :rows="3" placeholder="描述视频内容，不填则自动参考创意描述" maxlength="500" show-word-limit />
</el-form-item>
<el-form-item label="话题标签">
<el-input v-model="generatorForm.douyin_tags" placeholder="多个标签用逗号分隔，如：维修服务,快速上门,透明报价" />
</el-form-item>
</div>

<!-- 高级设置 -->
<el-collapse class="advanced-panel">
<el-collapse-item title="高级设置（可选）" name="advanced">
<div class="form-section">
<div class="grid cols2">
<el-form-item label="目标人群">
<el-input v-model="generatorForm.target_audience" placeholder="默认：通用本地客户" />
</el-form-item>
<el-form-item label="卖点关键词">
<el-input v-model="generatorForm.selling_points" placeholder="默认：快速上门,透明报价,维修质保" />
</el-form-item>
</div>
<div class="grid cols2">
<el-form-item label="开头钩子">
<el-input v-model="generatorForm.hook_text" placeholder="黄金3秒开头，不填则自动生成" />
</el-form-item>
<el-form-item label="行动引导">
<el-input v-model="generatorForm.cta_text" placeholder="默认：私信咨询，马上安排" />
</el-form-item>
</div>
<div class="grid cols2">
<el-form-item label="视频风格">
<el-select v-model="generatorForm.visual_style" placeholder="选择视频风格">
<el-option label="真实案例风 - 展示真实服务过程" value="真实案例风" />
<el-option label="门店实拍风 - 展示门店环境" value="门店实拍风" />
<el-option label="口播转化风 - 主播口播引导" value="口播转化风" />
<el-option label="专业讲解风 - 专业知识科普" value="专业讲解风" />
</el-select>
</el-form-item>
<el-form-item label="配音类型">
<el-select v-model="generatorForm.voice_type" placeholder="选择配音类型">
<el-option label="女声 - 温柔亲和" value="女声" />
<el-option label="男声 - 专业稳重" value="男声" />
<el-option label="专业旁白 - 正式播音" value="专业旁白" />
</el-select>
</el-form-item>
</div>
<div class="grid cols2">
<el-form-item label="字幕风格">
<el-select v-model="generatorForm.subtitle_style" placeholder="选择字幕风格">
<el-option label="营销大字 - 突出关键词" value="营销大字" />
<el-option label="重点高亮 - 强调核心信息" value="重点高亮" />
<el-option label="简洁字幕 - 干净清爽" value="简洁字幕" />
</el-select>
</el-form-item>
<el-form-item label="背景音乐">
<el-select v-model="generatorForm.bgm_style" placeholder="选择背景音乐">
<el-option label="轻快可信 - 积极向上" value="轻快可信" />
<el-option label="节奏感强 - 有冲击力" value="节奏感强" />
<el-option label="温和专业 - 稳重可信" value="温和专业" />
</el-select>
</el-form-item>
</div>
</div>
</el-collapse-item>
</el-collapse>

<el-form-item label="生成后处理">
<el-radio-group v-model="generatorForm.save_to_library">
<el-radio :value="true">自动保存到素材库</el-radio>
<el-radio :value="false">仅生成预览</el-radio>
</el-radio-group>
</el-form-item>

<div class="actions">
<el-button type="primary" :loading="generating" @click="handleGenerate">
<el-icon v-if="!generating"><VideoPlay /></el-icon>
开始创建
</el-button>
<el-button @click="resetGeneratorForm">重置</el-button>
<el-button v-if="pendingMaterial" type="success" plain @click="savePendingMaterial">保存到素材库</el-button>
</div>
</el-form>
</el-card>

<el-card shadow="never">
<template #header><div class="hd"><span>生成结果</span></div></template>
<div v-if="lastGenerated">
<div class="preview">
<video v-if="lastGenerated.video_url" :src="lastGenerated.video_url" controls preload="metadata" class="video-player" />
<el-image v-else-if="lastGenerated.cover" :src="lastGenerated.cover" fit="cover" preview-teleported :preview-src-list="[lastGenerated.cover]" />
<span v-else>暂无封面</span>
</div>
<div v-if="lastGenerated.video_url" class="video-actions">
<el-button link @click="handlePreviewVideo(lastGenerated)">播放视频</el-button>
<el-button link @click="handleDownload(lastGenerated)" :loading="lastGenerated.downloading">下载</el-button>
</div>
</div>
<el-empty v-else description="还没有生成结果" />
</el-card>
</div>
</el-tab-pane>

<el-tab-pane label="素材库" name="library">
<el-card shadow="never">
<template #header><div class="hd wrap"><span>视频素材库</span><div class="actions"><el-input v-model="searchForm.title" placeholder="搜索标题 / 描述 / 标签" clearable @keyup.enter="handleSearch" /><el-select v-model="searchForm.status" clearable @change="handleSearch"><el-option label="全部状态" value="" /><el-option label="已发布" :value="1" /><el-option label="待发布" :value="0" /></el-select><el-button @click="handleSearch">搜索</el-button></div></div></template>
<div class="table-header"><el-button type="primary" @click="handleAdd">添加素材</el-button></div>
<el-table :data="tableData" v-loading="loading" border stripe>
<el-table-column prop="title" label="标题" min-width="180" />
<el-table-column prop="video_url" label="视频链接" min-width="140"><template #default="{ row }"><el-link v-if="row.video_url" :href="row.video_url" target="_blank" type="primary">打开视频</el-link><span v-else>暂无</span></template></el-table-column>
<el-table-column prop="tags" label="标签" min-width="180"><template #default="{ row }"><div class="tags"><el-tag v-for="tag in normalizeTags(row.tags)" :key="tag" effect="plain">{{ tag }}</el-tag></div></template></el-table-column>
<el-table-column prop="status" label="状态" width="90"><template #default="{ row }"><el-tag :type="Number(row.status)===1?'success':'warning'">{{ Number(row.status)===1?'已发布':'待发布' }}</el-tag></template></el-table-column>
<el-table-column label="操作" width="360" fixed="right"><template #default="{ row }"><a class="text-btn text-primary" @click="handleEdit(row)">编辑信息</a><el-button link type="warning" :loading="row.optimizing" @click="openOptimizeDialog(row)">优化视频</el-button><el-button link type="info" :loading="row.downloading" @click="handleDownload(row)">下载</el-button><el-button link type="success" @click="handlePublish(row)">发布</el-button><el-button link type="danger" @click="handleDelete(row)">删除</el-button></template></el-table-column>
</el-table>
<el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next, jumper" @size-change="fetchData" @current-change="fetchData" />
</el-card>
</el-tab-pane>

<el-tab-pane label="视频流量分析" name="analysis">
<div class="grid four">
<div class="box"><small>累计播放量</small><b>{{ formatNumber(totalViews) }}</b></div>
<div class="box"><small>累计点赞数</small><b>{{ formatNumber(totalLikes) }}</b></div>
<div class="box"><small>累计评论数</small><b>{{ formatNumber(totalComments) }}</b></div>
<div class="box"><small>累计分享数</small><b>{{ formatNumber(totalShares) }}</b></div>
</div>
</el-tab-pane>
</el-tabs>

<el-dialog v-model="dialogVisible" :title="isEdit ? '编辑素材' : '新增素材'" width="720px">
<el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
<el-form-item label="标题" prop="title"><el-input v-model="form.title" /></el-form-item>
<el-form-item label="上传视频" required>
<el-upload class="video-uploader" :auto-upload="false" :show-file-list="false" accept=".mp4,.mov,.avi,.mkv,.webm,.wmv,.flv,.m4v" :on-change="handleVideoChange">
<video v-if="form.video_url" :src="form.video_url" class="upload-preview" controls />
<div v-else class="upload-placeholder">
<el-icon><VideoPlay /></el-icon>
<span>点击选择视频文件</span>
</div>
</el-upload>
</el-form-item>
<el-form-item label="封面图">
<div class="cover-options">
<div class="cover-option" :class="{active: coverSource==='video'}" @click="coverSource='video'">
<video v-if="form.video_url" :src="form.video_url" class="video-frame" ref="videoCoverRef" @loadedmetadata="extractVideoFrame" />
<div v-else class="cover-placeholder">视频首帧</div>
<span class="cover-label">视频首帧</span>
</div>
<div class="cover-option" :class="{active: coverSource==='custom'}" @click="coverSource='custom'">
<el-image v-if="form.cover" :src="form.cover" class="upload-preview" fit="cover" />
<div v-else class="cover-placeholder">自定义封面</div>
<span class="cover-label">自定义封面</span>
</div>
</div>
<el-upload v-if="coverSource==='custom'" class="cover-uploader" :auto-upload="false" :show-file-list="false" accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.svg" :on-change="handleCoverChange">
<div class="upload-trigger">
<el-icon><Plus /></el-icon>
<span>选择图片</span>
</div>
</el-upload>
</el-form-item>
<el-form-item label="视频描述"><el-input v-model="form.description" type="textarea" :rows="4" /></el-form-item>
<el-form-item label="话题标签"><el-input v-model="form.tags" /></el-form-item>
<el-form-item label="状态"><el-radio-group v-model="form.status"><el-radio :value="1">已发布</el-radio><el-radio :value="0">待发布</el-radio></el-radio-group></el-form-item>
</el-form>
<template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="handleSubmit">确定</el-button></template>
</el-dialog>

<el-dialog v-model="optimizeDialogVisible" title="优化视频" width="760px"><el-form ref="optimizeFormRef" :model="optimizeForm" label-position="top"><div class="grid cols2"><el-form-item label="封面文案"><el-input v-model="optimizeForm.cover_text" placeholder="例如：30分钟快速上门" /></el-form-item><el-form-item label="字幕风格"><el-select v-model="optimizeForm.subtitle_style"><el-option label="营销大字" value="营销大字" /><el-option label="重点高亮" value="重点高亮" /><el-option label="简洁字幕" value="简洁字幕" /></el-select></el-form-item></div><div class="grid cols2"><el-form-item label="配音类型"><el-select v-model="optimizeForm.voice_type"><el-option label="保持原样" value="保持原样" /><el-option label="女声" value="女声" /><el-option label="男声" value="男声" /><el-option label="专业旁白" value="专业旁白" /></el-select></el-form-item><el-form-item label="背景音乐"><el-select v-model="optimizeForm.bgm_style"><el-option label="保持原样" value="保持原样" /><el-option label="轻快可信" value="轻快可信" /><el-option label="节奏感强" value="节奏感强" /><el-option label="温和专业" value="温和专业" /></el-select></el-form-item></div><div class="grid cols2"><el-form-item label="裁剪时长（秒）"><el-input-number v-model="optimizeForm.trim_duration" :min="0" :max="180" :step="5" style="width:100%" /></el-form-item><el-form-item label="标题风格"><el-select v-model="optimizeForm.title_style"><el-option label="强转化" value="强转化" /><el-option label="专业可信" value="专业可信" /><el-option label="自然种草" value="自然种草" /></el-select></el-form-item></div><div class="grid cols2 switches"><el-form-item label="添加片头"><el-switch v-model="optimizeForm.add_intro" inline-prompt active-text="开" inactive-text="关" /></el-form-item><el-form-item label="添加片尾"><el-switch v-model="optimizeForm.add_outro" inline-prompt active-text="开" inactive-text="关" /></el-form-item></div><el-form-item label="优化说明"><el-input v-model="optimizeForm.optimize_prompt" type="textarea" :rows="3" placeholder="例如：保留原视频核心内容，强化获客转化和封面吸引力" /></el-form-item></el-form><template #footer><el-button @click="optimizeDialogVisible=false">取消</el-button><el-button type="primary" :loading="optimizing" @click="handleOptimize">开始优化</el-button></template></el-dialog>
<el-dialog v-model="publishDialogVisible" title="一键发布需要准备什么" width="620px"><ol><li>申请抖音开放平台应用与发布权限</li><li>服务端保存授权信息</li><li>素材库补充账号、封面、标题、话题、发布时间</li><li>新增服务端发布接口并回写结果</li></ol><template #footer><el-button type="primary" @click="publishDialogVisible=false">我知道了</el-button></template></el-dialog>
</div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { VideoPlay, Download, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createDouyin, deleteDouyin, downloadDouyin, downloadDouyinFile, generateDouyinVideo, getDouyinList, getPublishStatus, optimizeDouyinVideo, publishDouyin, updateDouyin } from '@/api/marketing'
import { uploadFile } from '@/api/system'
const createDefaults=()=>({prompt:'',resolution:'1080p',ratio:'9:16',duration:30,watermark:false,douyin_title:'',douyin_desc:'',douyin_tags:'',target_audience:'通用本地客户',selling_points:'快速上门,透明报价,维修质保',hook_text:'',cta_text:'私信咨询，马上安排',visual_style:'真实案例风',voice_type:'女声',subtitle_style:'营销大字',bgm_style:'轻快可信',save_to_library:true})
const createOptimizeDefaults=()=>({cover_text:'',subtitle_style:'营销大字',voice_type:'保持原样',bgm_style:'保持原样',trim_duration:0,add_intro:true,add_outro:false,title_style:'强转化',optimize_prompt:'保留原视频核心内容，强化封面、标题和转化表达。'})
const activeTab=ref('creator'),loading=ref(false),generating=ref(false),publishing=ref(false),optimizing=ref(false),dialogVisible=ref(false),optimizeDialogVisible=ref(false),publishDialogVisible=ref(false),isEdit=ref(false),formRef=ref(null),generatorFormRef=ref(null),optimizeFormRef=ref(null),lastGenerated=ref(null),pendingMaterial=ref(null),tableData=ref([]),currentOptimizeRow=ref(null),uploadingVideo=ref(false),uploadingCover=ref(false),coverSource=ref('video'),videoCoverRef=ref(null),videoCoverData=ref('')
const searchForm=reactive({title:'',status:''}),pagination=reactive({page:1,pageSize:10,total:0}),form=reactive({id:null,title:'',video_url:'',cover:'',description:'',tags:'',status:0}),generatorForm=reactive(createDefaults()),optimizeForm=reactive(createOptimizeDefaults())
const rules={title:[{required:true,message:'请输入标题',trigger:'blur'}],video_url:[{required:true,message:'请上传视频',trigger:'change'}]},generatorRules={prompt:[{required:true,message:'请输入视频创意描述',trigger:'blur'}],resolution:[{required:true,message:'请选择清晰度',trigger:'change'}],ratio:[{required:true,message:'请选择画面比例',trigger:'change'}],duration:[{required:true,message:'请设置视频时长',trigger:'change'}],douyin_title:[{required:true,message:'请输入抖音标题',trigger:'blur'}]}
const formatNumber=n=>{const v=Number(n||0);return v>=10000?`${(v/10000).toFixed(1)}万`:`${v}`},normalizeTags=t=>String(t||'').split(/[，,]/).map(v=>v.trim()).filter(Boolean)
const totalViews=computed(()=>tableData.value.reduce((s,i)=>s+Number(i.views||0),0)),totalLikes=computed(()=>tableData.value.reduce((s,i)=>s+Number(i.likes||0),0)),totalComments=computed(()=>tableData.value.reduce((s,i)=>s+Number(i.comments||0),0)),totalShares=computed(()=>tableData.value.reduce((s,i)=>s+Number(i.shares||0),0)),publishedCount=computed(()=>tableData.value.filter(i=>Number(i.status)===1).length)
const buildGeneratorPayload=()=>({prompt:generatorForm.prompt,resolution:generatorForm.resolution,ratio:generatorForm.ratio,duration:generatorForm.duration,watermark:generatorForm.watermark,douyin_title:generatorForm.douyin_title,douyin_desc:generatorForm.douyin_desc,douyin_tags:generatorForm.douyin_tags,save_to_library:generatorForm.save_to_library,video_config:{target_audience:generatorForm.target_audience,selling_points:normalizeTags(generatorForm.selling_points),hook_text:generatorForm.hook_text,cta_text:generatorForm.cta_text,visual_style:generatorForm.visual_style,voice_type:generatorForm.voice_type,subtitle_style:generatorForm.subtitle_style,bgm_style:generatorForm.bgm_style}})
const fetchData=async()=>{loading.value=true;try{const res=await getDouyinList({page:pagination.page,pageSize:pagination.pageSize,page_size:pagination.pageSize,title:searchForm.title,keyword:searchForm.title,status:searchForm.status});tableData.value=(res.data.list||[]).map(item=>({...item,downloading:false,optimizing:false}));pagination.total=res.data.total||0;if(!lastGenerated.value&&tableData.value.length)lastGenerated.value=tableData.value[0]}finally{loading.value=false}}
const handleSearch=()=>{pagination.page=1;fetchData()},resetGeneratorForm=()=>{Object.assign(generatorForm,createDefaults());pendingMaterial.value=null;generatorFormRef.value?.clearValidate()}
const handleAdd=()=>{formRef.value?.resetFields();Object.assign(form,{id:null,title:'',video_url:'',cover:'',description:'',tags:'',status:0});isEdit.value=false;coverSource.value='video';videoCoverData.value='';dialogVisible.value=true}
const handleEdit=row=>{Object.assign(form,row);isEdit.value=true;coverSource.value=form.cover?'custom':'video';videoCoverData.value='';dialogVisible.value=true}
const handleVideoChange=async(file)=>{if(!file||!file.raw)return;uploadingVideo.value=true;try{const res=await uploadFile(file.raw);if(res.code===0||res.code===200){form.video_url=res.data.url;form.cover='';coverSource.value='video';videoCoverData.value='';ElMessage.success('视频上传成功');setTimeout(extractVideoFrame,500)}else{ElMessage.error(res.message||'上传失败')}}catch(e){console.error(e);ElMessage.error('上传失败')}finally{uploadingVideo.value=false}}
const extractVideoFrame=()=>{if(!form.video_url||!videoCoverRef.value)return;const video=videoCoverRef.value;const canvas=document.createElement('canvas');canvas.width=video.videoWidth||320;canvas.height=video.videoHeight||180;const ctx=canvas.getContext('2d');ctx.drawImage(video,0,0,canvas.width,canvas.height);videoCoverData.value=canvas.toDataURL('image/jpeg',0.8)}
const handleCoverChange=async(file)=>{if(!file||!file.raw)return;uploadingCover.value=true;try{const res=await uploadFile(file.raw);if(res.code===0||res.code===200){form.cover=res.data.url;ElMessage.success('封面上传成功')}else{ElMessage.error(res.message||'上传失败')}}catch(e){console.error(e);ElMessage.error('上传失败')}finally{uploadingCover.value=false}}
const openOptimizeDialog=row=>{currentOptimizeRow.value=row;Object.assign(optimizeForm,createOptimizeDefaults(),{trim_duration:Number(row.duration||0)||0});optimizeDialogVisible.value=true}
const handlePublish=async row=>{try{await ElMessageBox.confirm('确定要发布该视频到抖音吗？','提示',{type:'warning'});publishing.value=true;const res=await publishDouyin(row.id);if(res.code===0){let checkCount=0;const checkStatus=async()=>{if(checkCount>=30){ElMessage.warning('发布超时，请稍后刷新查看');return}const statusRes=await getPublishStatus(row.id);if(statusRes.data.status==='success'){ElMessage.success('发布成功');fetchData()}else if(statusRes.data.status==='pending'||statusRes.data.status==='processing'){checkCount++;setTimeout(checkStatus,2000)}};checkStatus()}else{ElMessage.error(res.message||'发布失败')}}catch(e){if(e!=='cancel')console.error(e)}finally{publishing.value=false}}
const handleDelete=async row=>{try{await ElMessageBox.confirm('确定要删除该素材吗？','提示',{type:'warning'});await deleteDouyin(row.id);ElMessage.success('删除成功');fetchData()}catch(e){if(e!=='cancel')console.error(e)}}
const handleDownload=async row=>{try{row.downloading=true;const res=await downloadDouyin(row.id);if(res.code===0||res.code===200){row.local_path=res.data.local_path;row.local_filename=res.data.local_filename;row.description=res.data.description;row.tags=res.data.tags;const fileRes=await downloadDouyinFile(row.id);const blob=new Blob([fileRes.data],{type:fileRes.headers['content-type']||'video/mp4'});const url=window.URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=row.local_filename||res.data.local_filename||`${row.title||'douyin-video'}.mp4`;document.body.appendChild(link);link.click();document.body.removeChild(link);window.URL.revokeObjectURL(url);ElMessage.success(res.message||'下载成功')}else{ElMessage.error(res.message||'下载失败')}}catch(e){console.error(e)}finally{row.downloading=false}}
const handleSubmit=async()=>{const valid=await formRef.value?.validate().catch(()=>false);if(!valid)return;if(coverSource.value==='video'&&videoCoverData.value){try{const res=await fetch(videoCoverData.value).then(r=>r.blob());const file=new File([res],'cover.jpg',{type:'image/jpeg'});const uploadRes=await uploadFile(file);if(uploadRes.code===0||uploadRes.code===200){form.cover=uploadRes.data.url}else{ElMessage.warning('封面上传失败，将使用默认封面')}}catch(e){console.error(e);ElMessage.warning('封面提取失败')}}isEdit.value?await updateDouyin(form.id,form):await createDouyin(form);ElMessage.success(isEdit.value?'编辑成功':'新增成功');dialogVisible.value=false;fetchData()}
const handleGenerate=async()=>{const valid=await generatorFormRef.value?.validate().catch(()=>false);if(!valid)return;generating.value=true;try{const res=await generateDouyinVideo(buildGeneratorPayload());lastGenerated.value={...res.data.saved||res.data.draft_material||{},downloading:false};pendingMaterial.value=res.data.save_to_library?null:res.data.draft_material;ElMessage.success(res.message||'视频创建成功');if(res.data.save_to_library){activeTab.value='library';await fetchData()}}finally{generating.value=false}}
const handlePreviewVideo=row=>{if(row.video_url){window.open(row.video_url,'_blank')}}
const handleOptimize=async()=>{if(!currentOptimizeRow.value)return;optimizing.value=true;currentOptimizeRow.value.optimizing=true;try{const res=await optimizeDouyinVideo(currentOptimizeRow.value.id,{edit_config:{...optimizeForm}});const updated=res.data.updated_material||res.data.material||null;if(updated){Object.assign(currentOptimizeRow.value,updated);lastGenerated.value=updated}optimizeDialogVisible.value=false;ElMessage.success(res.message||'视频优化成功');await fetchData()}finally{optimizing.value=false;currentOptimizeRow.value.optimizing=false}}
const savePendingMaterial=async()=>{if(!pendingMaterial.value)return;await createDouyin(pendingMaterial.value);ElMessage.success('已保存到素材库');pendingMaterial.value=null;activeTab.value='library';fetchData()}
onMounted(fetchData)
</script>

<style scoped>
.page{display:flex;flex-direction:column;gap:20px;background:#f6f8fc;color:#24324a}
.hero,.box,:deep(.el-card){background:#fff;border:1px solid #e6ebf5;border-radius:20px;box-shadow:0 10px 30px rgba(34,62,120,.08)}
.hero{display:grid;grid-template-columns:1.4fr 1fr;gap:20px;padding:28px;background:linear-gradient(135deg,#fff9f2 0%,#eef6ff 100%);position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;right:-50px;top:-50px;width:200px;height:200px;background:linear-gradient(135deg,rgba(255,159,0,0.1),rgba(255,200,0,0.05));border-radius:50%}
.hero .hero-content{position:relative;z-index:1}
.hero p{font-size:14px;color:#ff8c00;font-weight:600;margin:0 0 8px;letter-spacing:2px;text-transform:uppercase}
.hero h2{font-size:28px;font-weight:700;margin:0 0 12px;background:linear-gradient(135deg,#24324a,#4a5568);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero span{font-size:14px;color:#666;line-height:1.6}
.stats,.four{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.four{grid-template-columns:repeat(4,1fr)}
.box{padding:18px;position:relative;transition:transform .2s,box-shadow .2s}
.box:hover{transform:translateY(-2px);box-shadow:0 15px 40px rgba(34,62,120,.12)}
.box small{font-size:13px;color:#8c9ab3;font-weight:500}
.box b{display:block;margin-top:8px;font-size:28px;font-weight:700;color:#24324a}
.box::before{content:'';position:absolute;top:0;left:0;width:4px;height:100%;background:linear-gradient(180deg,#ff9f00,#ffc107);border-radius:20px 0 0 20px}
.box:nth-child(2)::before{background:linear-gradient(180deg,#409eff,#67b8ff)}
.box:nth-child(3)::before{background:linear-gradient(180deg,#67c23a,#95de64)}
.grid{display:grid;gap:20px}
.two{grid-template-columns:minmax(0,1.2fr) minmax(320px,.8fr)}
.cols2{grid-template-columns:repeat(2,1fr)}
.hd,.wrap,.actions,.tags,.between{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.tags :deep(.el-tag){min-width:6em;justify-content:center}
.hd{font-weight:600;font-size:15px}
.preview{height:220px;border-radius:18px;overflow:hidden;background:#f5f7fb;border:1px dashed #c9d5ea;display:flex;align-items:center;justify-content:center}
.preview :deep(.el-image),.preview :deep(img),.preview video{width:100%;height:100%}
.video-player{object-fit:contain}
.video-actions{display:flex;gap:12px;margin-top:12px;justify-content:center}
.video-actions .el-button{font-weight:500;color:#409eff}
.video-actions .el-button:hover{color:#66b1ff}
:deep(.el-button--primary.is-link){color:#409eff}
:deep(.el-button--primary.is-link:hover){color:#66b1ff}
:deep(.el-button--success.is-link){color:#67c23a}
:deep(.el-button--success.is-link:hover){color:#85ce61}
:deep(.el-button--warning.is-link){color:#e6a23c}
:deep(.el-button--warning.is-link:hover){color:#ebb563}
:deep(.el-button--danger.is-link){color:#f56c6c}
:deep(.el-button--danger.is-link:hover){color:#f78989}
:deep(.el-button--info.is-link){color:#909399}
:deep(.el-button--info.is-link:hover){color:#a6a9ad}
.advanced-panel{margin:12px 0}
.advanced-panel :deep(.el-collapse-item__header){font-weight:500;color:#666}
.advanced-panel :deep(.el-collapse-item__header:hover){color:#409eff}
.switches :deep(.el-form-item__content){justify-content:flex-start}
:deep(.el-card__header){border-bottom:1px solid #edf1f7;padding:16px 20px}
:deep(.el-card__body){padding:20px}
:deep(.el-table){--el-table-border-color:#e8eef7;--el-table-header-bg-color:#f8fbff;--el-table-row-hover-bg-color:#f6faff}
:deep(.el-table th.el-table__cell){font-weight:600;color:#24324a}
:deep(.el-input__wrapper),:deep(.el-textarea__inner),:deep(.el-select__wrapper),:deep(.el-input-number){box-shadow:none;border:1px solid #d9e3f0;background:#fff}
:deep(.el-input__wrapper:hover),:deep(.el-textarea__inner:hover),:deep(.el-select__wrapper:hover){border-color:#409eff}
:deep(.el-input__wrapper.is-focus),:deep(.el-textarea__inner:focus),:deep(.el-select__wrapper.is-focus){border-color:#409eff;box-shadow:0 0 0 2px rgba(64,158,255,.1)}
:deep(.el-pagination){margin-top:20px;justify-content:flex-end}
:deep(.el-pagination .el-pager li){background:#fff;border:1px solid #d9e3f0;color:#24324a}
:deep(.el-pagination .el-pager li:hover){color:#409eff}
:deep(.el-pagination .el-pager li.is-active){background:#409eff;border-color:#409eff;color:#fff}
:deep(.el-pagination .btn-prev),:deep(.el-pagination .btn-next){background:#fff;border:1px solid #d9e3f0;color:#24324a}
:deep(.el-pagination .btn-prev:hover),:deep(.el-pagination .btn-next:hover){color:#409eff}
:deep(.el-pagination__total){color:#666}
:deep(.el-pagination__sizes){color:#666}
:deep(.el-pagination__jump){color:#666}
:deep(.el-button--primary){background:#409eff;border-color:#409eff}
:deep(.el-button--primary:hover){background:#66b1ff;border-color:#66b1ff}
:deep(.el-tabs__item.is-active){color:#409eff;font-weight:600}
:deep(.el-tabs__active-bar){background:#409eff}
.table-header{margin-bottom:16px}
.table-header .el-button{background:linear-gradient(135deg,#409eff,#67b8ff);border:none}
.table-header .el-button:hover{background:linear-gradient(135deg,#66b1ff,#79bbff)}
.form-section{margin-bottom:24px}
.section-title{font-size:14px;font-weight:600;color:#24324a;margin:0 0 16px;padding-left:12px;border-left:3px solid #409eff}
.duration-input{display:flex;align-items:center;gap:8px}
.duration-tip{color:#8c9ab3;font-size:13px}
.video-uploader,.cover-uploader{width:100%}
:deep(.video-uploader .el-upload),:deep(.cover-uploader .el-upload){width:100%;display:block}
.upload-preview{width:100%;max-height:200px;border-radius:8px;object-fit:contain}
.upload-placeholder{height:120px;border:2px dashed #d9e3f0;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#8c9ab3;cursor:pointer;transition:all .2s}
.upload-placeholder:hover{border-color:#409eff;color:#409eff}
.upload-placeholder .el-icon{font-size:32px}
.cover-options{display:flex;gap:12px;margin-bottom:12px}
.cover-option{flex:1;cursor:pointer;border:2px solid #e6ebf5;border-radius:8px;padding:8px;text-align:center;transition:all .2s}
.cover-option:hover{border-color:#409eff}
.cover-option.active{border-color:#409eff;background:#f0f7ff}
.cover-option .video-frame,.cover-option .el-image{width:100%;height:100px;object-fit:cover;border-radius:4px}
.cover-option .cover-placeholder{height:100px;display:flex;align-items:center;justify-content:center;background:#f5f7fb;color:#8c9ab3;border-radius:4px}
.cover-option .cover-label{display:block;margin-top:8px;font-size:12px;color:#666}
.cover-uploader .upload-trigger{height:80px;border:2px dashed #d9e3f0;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#8c9ab3;cursor:pointer;transition:all .2s}
.cover-uploader .upload-trigger:hover{border-color:#409eff;color:#409eff}
@media (max-width:1280px){.hero,.two{grid-template-columns:1fr}.stats,.four{grid-template-columns:repeat(2,1fr)}}
@media (max-width:768px){.stats,.four,.cols2{grid-template-columns:1fr}}
/* 清除操作按钮的所有默认样式 */
:deep(.el-button--link),
:deep(.el-button.link),
:deep(.el-button--link:focus),
:deep(.el-button.link:focus),
:deep(.el-button--link:active),
:deep(.el-button.link:active),
:deep(.el-button--link.is-focus),
:deep(.el-button.link.is-focus) {
  background: transparent !important;
  outline: none !important;
  border: none !important;
  box-shadow: none !important;
  padding: 2px 4px !important;
  font-size: 14px !important;
  font-weight: 400 !important;
}
:deep(.el-button--link.type-primary),
:deep(.el-button--link[type="primary"]),
:deep(.el-button.link.type-primary),
:deep(.el-button.link[type="primary"]) {
  color: #409eff !important;
}
:deep(.el-button--link.type-success),
:deep(.el-button--link[type="success"]),
:deep(.el-button.link.type-success),
:deep(.el-button.link[type="success"]) {
  color: #67c23a !important;
}
:deep(.el-button--link.type-warning),
:deep(.el-button--link[type="warning"]),
:deep(.el-button.link.type-warning),
:deep(.el-button.link[type="warning"]) {
  color: #e6a23c !important;
}
:deep(.el-button--link.type-danger),
:deep(.el-button--link[type="danger"]),
:deep(.el-button.link.type-danger),
:deep(.el-button.link[type="danger"]) {
  color: #f56c6c !important;
}
:deep(.el-button--link.type-info),
:deep(.el-button--link[type="info"]),
:deep(.el-button.link.type-info),
:deep(.el-button.link[type="info"]) {
  color: #909399 !important;
}
:deep(.el-button--link:hover),
:deep(.el-button.link:hover) {
  background: transparent !important;
  text-decoration: none !important;
  outline: none !important;
  border: none !important;
  box-shadow: none !important;
}
:deep(.el-button--link.is-disabled),
:deep(.el-button--link[disabled]),
:deep(.el-button.link.is-disabled),
:deep(.el-button.link[disabled]) {
  background: transparent !important;
  color: #c0c4cc !important;
  outline: none !important;
  border: none !important;
  box-shadow: none !important;
}
</style>