<template>
  <div class="subtitle-container">
    <!-- 原文字幕卡片 -->
    <el-card class="subtitle-box" v-show="showOriginal">
      <template #header>
        <div class="subtitle-header">原文字幕</div>
        <div class="IsOriginal">
          <el-button @click="showOriginal = true" type="primary" plain>原文</el-button>
          <el-button @click="showOriginal = false" type="success" plain>翻译</el-button>
        </div>
      </template>
      <div class="subtitle-content">
        <div class="section-title">
          实时字幕
          <el-button @click="downloadOriginalSubtitle" type="primary" :icon="Download" />
        </div>
        <div class="subtitle-line">{{ originalRealTime }}_{{ loderTxext }}</div>
        <div class="section-title">累计对话</div>

        <div class="subtitle-all" v-html="originalSubtitleText + originalRealTime"></div>
      </div>
    </el-card>

    <!-- 翻译字幕卡片 -->
    <el-card class="subtitle-box" v-show="!showOriginal">
      <template #header>
        <div class="subtitle-header">翻译字幕</div>
        <div class="IsOriginal">
          <el-button @click="showOriginal = true" type="primary" plain>原文</el-button>
          <el-button @click="showOriginal = false" type="success" plain>翻译</el-button>
        </div>
      </template>
      <div class="subtitle-content">
        <div class="section-title">
          实时字幕
          <el-button @click="downloadTranslatedSubtitle" type="success" :icon="Download" />
        </div>
        <div class="subtitle-line" v-html="translatedRealTime"></div>
        <div class="section-title">累计对话</div>
        <div class="subtitle-all" v-html="translatedSubtitleText"></div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { get } from "../utils/request"; // 引入请求方法
import { Download } from "@element-plus/icons-vue";
// 定义响应式变量
const showOriginal = ref(true);
const originalRealTime = ref("");
const translatedRealTime = ref("");
const originalSubtitleText = ref("");
const translatedSubtitleText = ref("");
const loderindex = ref(0);
let eventSource;

onMounted(async () => {
  const HearHost = localStorage.getItem("HearHost");
  try {
    try {
      const { data } = await get("/subtitle/readSubtitles");
      for(const item of data) {
        const { text, translateText } = item;
        const combinedText = `${text}<br>${translateText}`;
        translatedSubtitleText.value += combinedText + "<br>";
        originalSubtitleText.value += text + "<br>";
      }
      if (data) {
        console.log("data", data);
      }
    } catch (error) {
      console.error("Error fetching initial subtitles:", error);
    }
    if (!HearHost) {
      console.error("HearHost is not set in localStorage.");
      return;
    }
    eventSource = new EventSource(`http://${HearHost}/events`);
    eventSource.onopen = (e) => console.log("Connection opened", e);
    eventSource.onerror = (e) => console.error("Connection error", e);

    // 处理 captions 事件
    eventSource.addEventListener("captions", (e) => {
      try {
        const { captions } = JSON.parse(e.data);
        updateOriginalRealTime(captions);
        updateOriginalSubtitleText(captions);
      } catch (parseError) {
        console.error("Error parsing captions event data:", parseError);
      }
    });

    // 处理 translate 事件
    eventSource.addEventListener("translate", (e) => {
      try {
        const { captions } = JSON.parse(e.data);
        const { text, translateText, fixed } = captions;
        const combinedText = `${text}<br>${translateText}`;
        if (fixed) {
          translatedSubtitleText.value += combinedText + "<br>";
        }

        translatedRealTime.value = combinedText;
      } catch (parseError) {
        console.error("Error parsing translate event data:", parseError);
      }
    });
  } catch (error) {
    console.error("Failed to initialize EventSource:", error);
  }
});

// 在组件卸载时关闭 EventSource 连接
onUnmounted(() => {
  if (eventSource) {
    eventSource.close();
    console.log("EventSource connection closed");
  }
});

// 提取更新字幕逻辑的函数
const index = ref(0);
const str = ref("");
const updateOriginalRealTime = (captions) => {
  const { subSegments } = captions;
  const len = subSegments.length;
  if(index.value != subSegments[len - 1].index){
    index.value = subSegments[len - 1].index;
    console.log("index.value", str.value);
  }else{
    str.value = subSegments[len - 1].text;
  }
  if (loderindex.value > len) {
    loderTxext.value = "";
    originalRealTime.value = subSegments[len - 1].text;
    loderindex.value = len;
  } else if (loderindex.value == 1) {
    originalRealTime.value = subSegments[len - 1].text;
    loderTxext.value = " ";
    loderindex.value = len;
  } else {
    loderTxext.value = subSegments[len - 1].text;
    originalRealTime.value = subSegments[len - 2]?.text;
    loderindex.value = len;
  }
};

const updateOriginalSubtitleText = (captions) => {
  if (captions.fixed) {
    originalSubtitleText.value += captions.text + "<br>";
  }
};

const loderTxext = ref("正在加载中...");

// 下载原文字幕
const downloadOriginalSubtitle = () => {
  const cleanText = originalSubtitleText.value.replace(/<br>/g, ""); // 移除 <br> 标签
  const blob = new Blob([cleanText], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "原文字幕.txt";
  link.click();
  URL.revokeObjectURL(link.href);
};

// 下载翻译字幕
const downloadTranslatedSubtitle = () => {
  const cleanText = translatedSubtitleText.value.replace(/<br>/g, ""); // 移除 <br> 标签
  const blob = new Blob([cleanText], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "翻译字幕.txt";
  link.click();
  URL.revokeObjectURL(link.href);
};
</script>

<style scoped>
.subtitle-container {
  display: flex;
  height: 100vh;
}

.IsOriginal {
  display: flex;
  justify-content: center;
  margin-top: 5px;
}

.subtitle-box {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.subtitle-header {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
}

.subtitle-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  font-size: 16px;
  line-height: 1.6;
}

.subtitle-line {
  overflow-y: auto;
  height: 55px;
  margin-bottom: 10px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.subtitle-all {
  height: 30vh;
  overflow-y: auto;
  margin-bottom: 10px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 5px;
}
</style>
