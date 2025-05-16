<template>
  <el-form :model="form" label-width="120px">
    <!-- 语音转文字模型和翻译模型选择 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="语音转文字模型">
          <el-select
            v-model="form.speechToTextModel"
            placeholder="请选择语音转文字模型"
            class="form-container"
          >
            <el-option
              v-for="item in speechToTextModels"
              v-show="item.localPath !== ''"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="翻译模型">
          <el-select
            v-model="form.translationModel"
            placeholder="请选择翻译模型"
            class="form-container"
          >
            <el-option
              v-for="item in translationModels"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 文本处理模型选择和自定义模型输入框 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="文本处理模型">
          <el-select
            v-model="form.textProcessingModel"
            placeholder="请选择文本处理模型"
            @change="handleTextProcessingModelChange"
            class="form-container"
          >
            <el-option
              v-for="item in textProcessingModels"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
            <el-option label="自定义模型" value="custom"></el-option>
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12" v-if="form.textProcessingModel === 'custom'">
        <el-form-item label="自定义模型名称">
          <el-input
            v-model="form.customTextProcessingModel"
            placeholder="请输入自定义模型名称"
            class="form-container"
          ></el-input>
        </el-form-item>
      </el-col>
    </el-row>
    <!-- 新增音频语言选择 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="音频语言">
          <el-select
            v-model="form.audioLanguage"
            placeholder="请选择音频语言"
            class="form-container"
          >
            <el-option
              v-for="item in audioLanguages"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <!-- 新增音源选择 -->
        <el-form-item label="音源选择">
          <el-select
            v-model="form.source"
            placeholder="请选择音源"
            class="form-container"
          >
            <el-option label="麦克风" value="microphone" />
            <el-option label="扬声器" value="system" />
          </el-select>
        </el-form-item>
      </el-col>
      <!-- 新增翻译语言选择 -->
      <el-col :span="12">
        <el-form-item label="翻译语言">
          <el-select
            v-model="form.translationLanguage"
            placeholder="请选择翻译语言"
            class="form-container"
          >
            <el-option
              v-for="item in translationLanguages"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
    <!-- 是否翻译选择框 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="AI 地址">
          <el-input
            v-model="form.aiHost"
            placeholder="请输入 AI 地址"
            class="form-container"
          ></el-input>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="语音转换文字">
          <el-input
            v-model="form.HearHost"
            placeholder="请输入语音转换文字地址"
            class="form-container"
          ></el-input>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="声纹识别地址">
          <!-- 新增声纹识别输入框 -->
          <el-input
            v-model="form.voiceprintRecognitionUrl"
            placeholder="请输入声纹识别请求地址"
            class="form-container"
          ></el-input>
        </el-form-item>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="是否翻译">
          <el-switch
            v-model="form.enableTranslation"
            active-text="开启"
            inactive-text="关闭"
          ></el-switch>
        </el-form-item>
      </el-col>
    </el-row>
    <!-- 提交和停止按钮 -->

    <el-form-item>
      <div class="submit-buttons">
        <div>
          <el-button type="primary" @click="submitForm">提交</el-button>
          <el-button @click="fetchModels()" type="info">恢复默认设置</el-button>
        </div>
        <div class="button-group">
          <el-button type="primary" @click="startsubtitle">开始</el-button>
          <el-button type="danger" @click="confirmStop">停止</el-button>
          <!-- 字幕显示和关闭按钮 -->
          <el-button type="success" @click="showSubtitle">字幕显示</el-button>
          <el-button type="warning" @click="hideSubtitle">字幕关闭</el-button>
          <el-button type="primary" @click="goToSubtitle"
            >实时界面</el-button
          >
        </div>
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { useRouter } from "vue-router";
import { reactive, ref, onMounted } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import { get, put, post } from "../utils/request";

const router = useRouter();
const form = reactive({
  speechToTextModel: "",
  textProcessingModel: "",
  customTextProcessingModel: "", 
  translationModel: "",
  enableTranslation: false, 
  audioLanguage: "zh-Hans", 
  translationLanguage: "zh-Hans", 
  source: "", 
  aiHost: "", 
  HearHost: "", 
  // 新增声纹识别请求地址字段
  voiceprintRecognitionUrl: "", 
});

const speechToTextModels = ref([]);

const textProcessingModels = ref([]);
const translationModels = ref([]);

const realTimeText = ref("");
let ws = null;

// 获取模型数据
const fetchModels2ai = async () => {
  try {
    const response = await get("/models/ai");
    const arr = response.data.models;
    if (arr.length > 0) {
      ElMessage.success("ai模型数据加载成功");
      textProcessingModels.value = arr.map((item) => ({
        value: item.name,
        label: item.model,
      }));
      translationModels.value = arr.map((item) => ({
        value: item.name,
        label: item.model,
      }));
    } else {
      ElMessage.error("ai模型数据加载失败，请重试");
    }
    if (response.hearModels.length > 0) {
      speechToTextModels.value = response.hearModels.map((item) => ({
        value: item.model,
        label: item.model,
        localPath: item.localPath,
      }))
      ElMessage.success("语音转文字模型数据加载成功");
    } else {
      ElMessage.error("语音转文字模型数据加载失败，请重试");
    }
  } catch (error) {
    console.error("获取模型数据失败：", error);
    ElMessage.error("模型数据加载失败，请重试");
  }
};

const fetchModels = async () => {
  try {
    const response = await get("/models");
    const arr = response.data[0];
    for (const item in form) {
      form[item] = arr[item];
    }
    localStorage.setItem("HearHost", arr.HearHost);
  } catch (error) {
    console.error("获取默认模型数据失败：", error);
  }
};

const handleTextProcessingModelChange = () => {
  if (form.textProcessingModel !== "custom") {
    form.customTextProcessingModel = ""; // 清空自定义模型名称
  }
};

const submitForm = async () => {
  try {
    // 调用 PUT 请求，将表单数据传递到后端，包含声纹识别地址
    await put("/models/update", form);
    ElMessage.success("模型更新成功");
  } catch (error) {
    console.error("模型更新失败：", error);
    ElMessage.error("模型更新失败，请重试");
  }
};

const startsubtitle = async () => {
  try {
    const response = await post("/subtitle/start");
    console.log(response.data);
    ElMessage.success("连接成功");
    // 移除多余空格
    realTimeText.value = "";
  } catch (error) {
    console.error("连接失败：", error);
    ElMessage.error("连接失败，请重试");
  }
};

const confirmStop = () => {
  return ElMessageBox.confirm("确定要停止连接吗？", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      try {
        await post("/subtitle/stop");
        ElMessage.success("连接已停止");
        // 移除多余空格
        realTimeText.value = "";
      } catch (error) {
        console.error("停止连接失败：", error);
        ElMessage.error("停止连接失败，请重试");
      }
    })
    .catch(() => {
      console.log("取消停止操作");
      return Promise.reject(); // 拒绝 Promise 以阻止路由跳转
    });
};

// WebSocket 连接
onMounted(() => {
  fetchModels();
  fetchModels2ai();
  // 获取模型数据
});

const goToSubtitle = () => {
  router.push({ name: "Subtitle" });
};
// 提取重复的语言选项数据
const languages = [
  { value: "zh-Hans", label: "中文" },
  { value: "en", label: "英文" },
  { value: "ja", label: "日文" },
];

// 新增音频语言选项
const audioLanguages = languages;

// 新增翻译语言选项
const translationLanguages = languages;

// 统一错误提示信息
const SUBTITLE_ERROR_MSG = "字幕操作失败，请检查设备后重试";

// 字幕显示方法
const showSubtitle = async () => {
  try {
    // 添加空值检查
    const HearHost = localStorage.getItem("HearHost");
    if (!HearHost) {
      ElMessage.error("未获取到语音转换文字地址，请先提交设置");
      return;
    }

    const response = await post("/led/SendSubtitle", {
      HearHost,
      enableTranslation: form.enableTranslation,
    });

    // 统一处理响应状态
    if (response.status === 200) {
      ElMessage.success("字幕已显示");
    } else {
      ElMessage.error(SUBTITLE_ERROR_MSG);
    }
  } catch (error) {
    console.error("字幕显示错误：", error);
    ElMessage.error(SUBTITLE_ERROR_MSG);
  }
};

// 字幕关闭方法，添加警告框
const hideSubtitle = () => {
  ElMessageBox.confirm("确定要关闭字幕吗？", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      try {
        const response = await post("/led/stopSend");
        if (response.status === 200) {
          ElMessage.success("字幕已关闭");
        } else {
          ElMessage.error(SUBTITLE_ERROR_MSG);
        }
      } catch (error) {
        console.error("字幕关闭错误：", error);
        ElMessage.error(SUBTITLE_ERROR_MSG);
      }
    })
    .catch(() => {
      ElMessage.info("已取消关闭字幕操作");
    });
};
</script>

<style scoped>
/* 表单样式 */
.form-container {
  width: 300px; /* 表单宽度 */
}

/* 实时文字样式 */
.real-time-text {
  overflow-y: auto;
  margin-top: 20px;
  padding: 10px;
  font-size: 14px; /* 调整字体大小 */
  color: #333;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin: 0 auto;
  width: 90%; /* 与表单宽度一致 */
  text-align: center; /* 文本居中 */
}

.el-form-item {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
}
.submit-buttons {
  display: flex;
  flex-direction: column;
}
.button-group {
  margin-top: 30px;
}
</style>
