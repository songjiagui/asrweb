<template>
  <el-dialog v-model="downloadDialogVisible" title="下载选项" width="30%">
    <div class="download-options">
      <el-button type="primary" @click="download('wav')">音频</el-button>
      <el-button type="success" @click="download('original')">原文</el-button>
      <el-button type="success" @click="download('translation')"
        >译文</el-button
      >
      <el-button type="warning" @click="download('docx')">提纲</el-button>
    </div>
    <template #footer>
      <el-button @click="closeDialog">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import { ElMessage, ElLoading } from "element-plus";
// 引入 docx 库
import { Document, Packer, Paragraph } from "docx";

const props = defineProps({
  name: String, // 接收父组件传递的 name
  dialogVisible: Boolean, // 控制对话框显示
});
const emit = defineEmits(["update:dialogVisible"]); // 用于通知父组件更新 dialogVisible

const downloadDialogVisible = ref(false); // 控制生成提纲对话框显示
const outlineContent = ref(""); // 存储流式输出的提纲内容
// 假设译文内容由这个响应式变量存储，需根据实际情况修改
const translationContent = ref("");

// 监听父组件传递的 dialogVisible，控制对话框显示
watch(
  () => props.dialogVisible,
  (newVal) => {
    downloadDialogVisible.value = newVal;
    if (!newVal) {
      outlineContent.value = ""; // 关闭时清空内容
      translationContent.value = ""; // 关闭时清空译文内容
    }
  }
);

// 优化后的下载方法
const download = async (fileType) => {
  // 当 fileType 为 docx 时，通过请求获取提纲内容
  if (fileType === "docx") {
    const loadingInstance = ElLoading.service({
      lock: true,
      text: `正在下载 ${fileType.toUpperCase()} 文件...`,
      background: "rgba(0, 0, 0, 0.7)",
    });
    try {
      const baseUrl = "http://127.0.0.1:4001/file";
      const url = `${baseUrl}/${props.name}.txt`; // 假设后端返回 txt 文件
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "text/plain",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP 错误! 状态码: ${response.status}`);
      }

      const textContent = await response.text();

      // 处理换行符，将 \n 替换为 docx 库支持的换行符
      const paragraphs = textContent.split('\n').map(paragraphText => {
        return new Paragraph({
          text: paragraphText
        });
      });

      // 生成 Word 文档
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${props.name}_outline.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      ElMessage.success("提纲文档开始下载");
    } catch (error) {
      console.error("下载失败：", error);
      ElMessage.error(`下载失败，请重试。错误信息: ${error.message}`);
    } finally {
      loadingInstance.close();
    }
    return;
  }

  // 其他文件类型的下载逻辑保持不变
  const loadingInstance = ElLoading.service({
    lock: true,
    text: `正在下载 ${fileType.toUpperCase()} 文件...`,
    background: "rgba(0, 0, 0, 0.7)",
  });

  try {
    let url;
    let content;
    if (fileType === "wav") {
      const baseUrl = "http://127.0.0.1:4001/file";
      url = `${baseUrl}/${props.name}.${fileType}`;
    } else {
      // 原文和译文都从同一个 JSON 文件获取数据
      const baseUrl = "http://127.0.0.1:4001/file";
      url = `${baseUrl}/${props.name}.json`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP 错误! 状态码: ${response.status}`);
      }

      const jsonData = await response.json();
      if (fileType === "original") {
        console.log("原文数据：", jsonData);
        content = JSON.stringify(jsonData.segments); // 假设 segments 是数组
      } else if (fileType === "translation") {
        const translation = jsonData.translation.map((item) => {
          return {
            startTime: item.startTime,
            endTime: item.endTime,
            text: item.text,
            translateText: item.translateText,
          };
        });
        content = JSON.stringify(translation);
      }
    }

    if (fileType === "original" || fileType === "translation") {
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${props.name}_${fileType}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } else {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP 错误! 状态码: ${response.status}`);
      }

      const contentDisposition = response.headers.get("content-disposition");
      const fileName = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : `${props.name}.${fileType}`;

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    }

    ElMessage.success(
      `${
        fileType === "translation"
          ? "译文"
          : fileType === "original"
          ? "原文"
          : fileType.toUpperCase()
      } 文件下载成功`
    );
  } catch (error) {
    console.error("下载失败：", error);
    ElMessage.error(`下载失败，请重试。错误信息: ${error.message}`);
  } finally {
    loadingInstance.close();
  }
};

const closeDialog = () => {
  downloadDialogVisible.value = false; // 关闭对话框
  emit("update:dialogVisible", false); // 通知父组件关闭对话框
};
</script>

<style scoped>
.table {
  max-width: 98%;
  max-height: 80%;
  flex: 1;
  margin: 0 auto;
  box-shadow: 6px 6px 10px #999;
}
.column {
  font-size: 17px;
  /* box-shadow: 5px 5px 15px #555; */
}
.download-options {
  display: flex;
  gap: 5px;
}
</style>
