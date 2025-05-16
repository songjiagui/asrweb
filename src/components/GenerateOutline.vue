<template>
  <el-dialog v-model="outlineDialogVisible" title="生成提纲" width="70%">
    <div class="outline">
      <p>{{ outlineContent }}</p>
    </div>
    <template #footer>
      <el-button @click="confirmGenerateOutline" type="primary"
        >确认生成</el-button
      >
      <el-button @click="closeDialog">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { generate } from "../utils/request"; // 引入请求方法
const props = defineProps({
  name: String, // 接收父组件传递的 name
  dialogVisible: Boolean, // 控制对话框显示
});

const emit = defineEmits(["update:dialogVisible"]); // 用于通知父组件更新 dialogVisible

const outlineDialogVisible = ref(false); // 控制生成提纲对话框显示
const outlineContent = ref(""); // 存储流式输出的提纲内容

// 监听父组件传递的 dialogVisible，控制对话框显示
watch(
  () => props.dialogVisible,
  (newVal) => {
    outlineDialogVisible.value = newVal;
    if (!newVal) {
      outlineContent.value = ""; // 关闭时清空内容
    }
  }
);

// 确认生成提纲
const confirmGenerateOutline = async () => {
  try {
    const eventSource = await generate(props.name); // 调用生成提纲的 API
    // 处理 captions 事件
    outlineContent.value = "";
   
    eventSource.onmessage = (e) => {
      try {
        if (e.data !== "") {
          // 处理 [DONE] 事件
          const jsonData = JSON.parse(e.data);
          if (jsonData.response && !jsonData.done) {
            outlineContent.value += jsonData.response; // 提取并追加 content 数据
          }
        }
      } catch (error) {
        console.error("Error parsing captions event:", error);
      }
    };
  } catch (error) {
    console.error("生成提纲失败：", error);
    ElMessage.error("提纲生成失败，请重试");
  }
};

// 关闭对话框
const closeDialog = () => {
  outlineDialogVisible.value = false; // 关闭对话框
  emit("update:dialogVisible", false); // 通知父组件关闭对话框
};
</script>

<style scoped>
.outline {
  max-height: 70vh; /* 设置最大高度 */
  overflow-y: auto; /* 超出部分可滚动 */
}
</style>
