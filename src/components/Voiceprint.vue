<template>
  <!-- 声纹注册卡片 -->
  <div class="voiceprint">
    <el-card class="voiceprint-card">
      <template #header>
        <span>声纹注册</span>
      </template>
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="音频文件">
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="fileList"
            accept="audio/*"
          >
            <el-button type="primary">选择音频</el-button>
            <template #tip>
              <div class="el-upload__tip">仅支持音频文件，大小不超过10MB</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-button type="success" @click="submit">提交注册</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 声纹识别卡片 -->
    <el-card class="voiceprint-card">
      <template #header>
        <span>声纹识别</span>
      </template>
      <!-- 新增 el-form 包裹声纹识别内容 -->
      <el-form label-width="80px">
        <el-form-item label="用户名">
          <span>{{ recognizedUser || '未填写' }}</span>
        </el-form-item>
        <el-form-item label="音频文件">
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :on-change="handleRecFileChange"
            :file-list="recFileList"
            accept="audio/*"
          >
            <el-button type="primary">上传识别音频</el-button>
            <template #tip>
              <div class="el-upload__tip">仅支持音频文件，大小不超过10MB</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-button type="success" @click="recognizeUser">识别用户</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>

  <!-- 新增标签卡片 -->
  <el-card class="tag-card">
    <template #header>
      <span>声纹用户</span>
    </template>
    <div class="tag-container">
      <!-- 添加 closable 属性显示删除标志，绑定 @close 事件处理删除逻辑 -->
      <el-tag v-for="(tag, index) in tagData" effect="dark" :key="tag" class="tag-item" closable @close="handleTagClose(index)">
        {{ tag }}
      </el-tag>
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { uploadAudio, get, post } from '@/utils/request'
import { ElMessage, ElMessageBox } from "element-plus";

const form = ref({
  username: '',
  audio: null,
})

const fileList = ref([])

const handleFileChange = (file, fileListArr) => {
  form.value.audio = file.raw
  fileList.value = fileListArr
}

const submit = async () => {
  if (!form.value.username) {
    ElMessage.error('请输入用户名')
    return
  }
  if (!form.value.audio) {
    ElMessage.error('请上传音频文件')
    return
  }
  // 构建 FormData，包含 user_name 和音频
  const formData = new FormData()
  formData.append('user_name', form.value.username)
  formData.append('audio', form.value.audio)

  try {
    await uploadAudio('/voiceprint/register', formData)
    form.value.username = ''
    form.value.audio = null
    fileList.value = []
    ElMessage.success('注册提交成功')
  } catch (e) {
    ElMessage.error('注册失败')
  }
}

// 声纹识别相关
const recFileList = ref([])
const recAudio = ref(null)
// 存储识别结果
const recognizedUser = ref(null)

const handleRecFileChange = (file, fileListArr) => {
  recAudio.value = file.raw
  recFileList.value = fileListArr
}

// 识别用户方法
const recognizeUser = async () => {
  if (!recAudio.value) {
    ElMessage.error('请先上传识别音频文件')
    return
  }

  // 构建 FormData，包含音频
  const formData = new FormData()
  formData.append('audio', recAudio.value)

  try {
    const response = await uploadAudio('/voiceprint/recognition', formData)
    // 检查 response.result 是否存在
    if (response && response.result) {
      recognizedUser.value = response.result
      ElMessage.success('识别成功')
    } else {
      recognizedUser.value = null
      ElMessage.error('识别结果为空，请重试')
    }
  } catch (e) {
    recognizedUser.value = null
    ElMessage.error('识别失败')
    console.error('声纹识别出错:', e)
  }
}

// 存储标签数据
const tagData = ref([])

// 获取标签数据的方法
const fetchTagData = async () => {
  try {
    const response = await get('/voiceprint/getusers')
    if (response.user_names) {
      tagData.value = response.user_names
    } else {
      ElMessage.error('获取用户数据格式错误')
    }
  } catch (error) {
    ElMessage.error('获取用户数据失败，请重试')
  }
}

// 处理标签删除
const handleTagClose = async (index) => {
  try {
    // 弹出确认删除提示框
    await ElMessageBox.confirm('确定要删除该用户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    // 假设后端删除接口为 /voiceprint/deleteuser，并且需要传递用户名
    await post('/voiceprint/delete',  { user_name: tagData.value[index] })
    // 从数组中移除对应标签
    tagData.value.splice(index, 1)
    ElMessage.success('用户删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('用户删除失败，请重试')
      console.error('删除用户出错:', error)
    }
  }
}

onMounted(() => {
  fetchTagData()
})
</script>

<style scoped>
.voiceprint {
  display: flex;
  gap: 32px; /* 增加卡片间距 */
  margin-bottom: 32px;
}
.voiceprint-card {
  flex: 1; /* 让两个卡片等宽 */
}
.tag-card {
  width: 100%; /* 卡片宽度撑满容器 */
}
.tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px; /* 标签间距 */
}
.tag-item {
  margin-right: 8px;
  margin-bottom: 8px;
}
</style>