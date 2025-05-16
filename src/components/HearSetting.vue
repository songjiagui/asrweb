<template>
  <div class="model-settings-page">
    <h1>语音转文字设置</h1>
    <!-- 添加设置按钮 -->
    <el-button type="primary" @click="dialogVisible = true">设置</el-button>
    <!-- 设置对话框 -->
    <el-dialog v-model="dialogVisible" title="设置">
      <el-form :model="settingsForm">
        <el-form-item label="选择翻译模型">
          <el-select v-model="settingsForm.translationModel" placeholder="请选择翻译模型">
            <!-- 这里需要根据实际数据渲染选项 -->
            <el-option v-for="item in aiMode" :label="item.model" :value="item.model"></el-option>
          </el-select>
        </el-form-item>
        <!-- 修改为标签形式的多选 -->
        <el-form-item label="添加翻译模型">
          <div class="tag-container">
            <!-- 这里需要根据实际数据渲染标签 -->
            <el-check-tag
              v-for="item in aiMode"
              :checked="settingsForm.addedTranslationModels.includes(item.model)"
              @click="toggleModel(item.model)"
            >
              {{ item.model }}
            </el-check-tag>
          </div>
        </el-form-item>
        <el-form-item label="设置GPU">
          <el-input v-model="settingsForm.gpuSetting" placeholder="请输入GPU设置"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSettingsForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
    <!-- 设置语音转文字的 AI 模型 -->
    
    <el-form :model="form" style="width: 100%" border>
      <el-form-item>
        <el-table
          :data="paginatedData"
          style="width: 100%"
          :default-sort="{ prop: 'model', order: 'ascending' }"
          @sort-change="sortChange"
        >
          <el-table-column
            prop="model"
            label="模型名称"
            sortable
          ></el-table-column>
          <el-table-column
            prop="disk"
            label="模型大小"
            sortable
          ></el-table-column>
          <el-table-column prop="localPath" label="模型状态" sortable>
            <!-- 添加 sortable 属性并指定 prop -->
            <template #default="scope">
              <span
                :style="{
                  color: scope.row.localPath !== '' ? 'green' : 'gray',
                }"
                v-if="scope.row.downloadProgress === undefined"
              >
                {{ scope.row.localPath !== "" ? "已下载" : "未下载" }}
              </span>
              <span v-else> 下载中... </span>
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="scope">
              <!-- 根据模型状态显示不同内容 -->
              <template v-if="scope.row.downloadProgress > 0">
                <el-progress :percentage="scope.row.downloadProgress" />
              </template>
              <template v-if="scope.row.localPath !== ''">
                <el-button size="small" @click="selectModel(scope.row)">
                  {{ scope.row.repoFile }}
                </el-button>
              </template>
              <template v-else-if="scope.row.downloadProgress === undefined">
                <el-button
                  size="small"
                  type="primary"
                  @click="downloadModel(scope.row)"
                >
                  下载
                </el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>
        <!-- 分页组件 -->
        <el-pagination
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-size="pageSize"
          :total="asrModels.length"
          layout="prev, pager, next"
        >
        </el-pagination>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ElMessage, ElProgress } from "element-plus";
import { get } from "../utils/request";
import { ref, computed, onMounted,onUnmounted } from "vue";
// 模拟语音转文字模型列表
const asrModels = ref([]);
let eventSource
const aiMode = ref([]);
const getModel = async () => {
  try {
    const response = await get("/models/ai");
  aiMode.value = response.data.models;
  console.log(aiMode.value);
  if(response.hearModels.length > 0){
    asrModels.value = response.hearModels;
  }
  }catch (error) {
    console.error("Error fetching models:", error);
  }
  
  
};
// 表单数据
const form = ref({
  asrModel: "",
  translationPrompt: "",
});

// 分页相关数据
const currentPage = ref(1);
const pageSize = ref(5);

// 对话框相关数据
const dialogVisible = ref(false);
const settingsForm = ref({
  translationModel: "",
  gpuSetting: "",
  addedTranslationModels: [], 
});

// 模拟可用的翻译模型，实际应从后端获取
const availableTranslationModels = ref([
  { label: "模型1", value: "model1" },
  { label: "模型2", value: "model2" },
]);

// 切换模型选择状态
const toggleModel = (modelValue) => {
  const index = settingsForm.value.addedTranslationModels.indexOf(modelValue);
  if (index > -1) {
    settingsForm.value.addedTranslationModels.splice(index, 1);
  } else {
    settingsForm.value.addedTranslationModels.push(modelValue);
  }
};

// 切换页码的方法
const handleCurrentChange = (val) => {
  currentPage.value = val;
};

// 为了支持排序，需要监听排序事件
const sortChange = (sort) => {
  const { prop, order } = sort;
  if (prop && order) {
    asrModels.value.sort((a, b) => {
      if (prop === "localPath") {
        // 针对模型状态排序
        const aValue = a[prop] !== "" ? 1 : 0;
        const bValue = b[prop] !== "" ? 1 : 0;
        if (order === "ascending") {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      } else {
        if (order === "ascending") {
          return a[prop] > b[prop] ? 1 : -1;
        } else {
          return a[prop] < b[prop] ? 1 : -1;
        }
      }
    });
  }
};

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return asrModels.value.slice(start, end);
});
// 选择模型方法
const selectModel = (model) => {
  console.log("选择的模型：", model);
};

// 下载模型方法
const downloadModel = async (e) => {
  try {
    // 这里需要替换为实际的下载请求逻辑
    const response = await get(`/hear/download`, {
      model: e.model,
    });
    console.log(response);
    ElMessage.success("模型下载开始");
    e.downloadProgress = 0; // 初始化下载进度
  } catch (error) {
    console.error("下载失败：", error);
    ElMessage.error("模型下载失败，请重试");
    delete model.downloadProgress; // 移除下载进度
  }
};

// 保存设置方法
const saveSettings = () => {
  try {
    // 这里需要替换为实际的保存请求逻辑
    // 示例：const response = await fetch('your-save-url', { method: 'POST', body: JSON.stringify(form.value) });
    ElMessage.success("设置保存成功");
  } catch (error) {
    console.error("保存失败：", error);
    ElMessage.error("设置保存失败，请重试");
  }
};

// 保存对话框设置方法
const saveSettingsForm = () => {
  try {
    // 这里需要替换为实际的保存请求逻辑
    console.log('保存设置:', settingsForm.value);
    ElMessage.success("设置保存成功");
    dialogVisible.value = false;
  } catch (error) {
    console.error("保存失败：", error);
    ElMessage.error("设置保存失败，请重试");
  }
};

// 添加翻译模型方法
const addTranslationModel = () => {
  // 这里需要替换为实际的添加逻辑
  console.log('添加翻译模型');
};

onMounted(async () => {
  // 初始化时获取模型列表
  await getModel();
  const HearHost = localStorage.getItem("HearHost");
  eventSource = new EventSource(`http://${HearHost}/events`);
  eventSource.onopen = (e) => console.log("Connection opened", e);
  eventSource.onerror = (e) => console.error("Connection error", e);
  eventSource.addEventListener("download", (e) => {
    try {
      const jsonData = JSON.parse(e.data);
      if (jsonData.progress) {
        const model = jsonData.model;
        const progress = jsonData.progress;
        const targetModel = asrModels.value.find((m) => m.model === model);
        const id = asrModels.value.indexOf(targetModel);
        if (targetModel) {
          targetModel.downloadProgress = Number((progress * 100).toFixed(2));
          console.log(asrModels.value[id].downloadProgress);
        }
      } else {
        console.log(jsonData.status);
        if (jsonData.status === "completed") {
          const model = jsonData.model;
          const targetModel = asrModels.value.find((m) => m.model === model);
          if (targetModel) {
            targetModel.localPath = "已下载";
            delete targetModel.downloadProgress; // 移除下载进度
          }
        }
      }
    } catch (parseError) {
      console.error("Error parsing captions event data:", parseError);
    }
  });
});
onUnmounted(() => {
  if (eventSource) {
    eventSource.close();
    console.log("EventSource connection closed");
  }
});
</script>

<style scoped>
.model-settings-page {
  padding: 20px;
}
.tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px; /* 标签间距 */
}
</style>
