<template>
  <div class="container1">
    <!-- 大屏字幕示意图 -->
    <div
      class="screen"
      :style="{
        width: (form.width / form.height) * 350 + 'px', // 根据屏幕宽高比计算宽度
        height: 350 + 'px',
      }"
    >
      <div
        v-if="form.showSubtitle === 1"
        class="subtitle"
        :style="{
          fontSize: (form.fontSize / 800) * (form.width / form.height) * 100+ 'px', // 根据屏幕宽度动态调整字体大小
          color: form.fontColor,
          left: calculateX() + 'px', // 根据比例计算 X 坐标
          top: calculateY() + 'px', // 根据比例计算 Y 坐标
          width: calculateSubtitleBgWidth() + 'px', // 按比例计算字幕背景宽度
          height: (form.subtitleBgHeight / form.height) * 350 + 'px', // 按比例计算字幕背景高度
          border: '1px solid red', // 红色边框圈住字幕背景
          animation: form.scrollSubtitle ? 'scroll 5s linear infinite' : 'none', // 控制字幕是否滚动
        }"
      >
        示例字幕
      </div>
    </div>
    <span class="remark">温馨提示：此图为参考示意，具体细节以实际为准。</span>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" class="led-form">
      <!-- 型号和 IP 在同一行 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="屏的型号" prop="driver">
            <el-select v-model="form.driver" placeholder="请选择屏的型号">
              <el-option label="诺瓦H系列" value="H"></el-option>
              <el-option label="诺瓦V系列" value="V"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="视频处理器 IP" prop="ip">
            <el-input v-model="form.ip" placeholder="请输入 IP 地址"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 字体大小和颜色在同一行 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="字体大小" prop="fontSize">
            <el-input-number
              v-model="form.fontSize"
              :min="0"
              :step="10"
              placeholder="请输入字体大小"
            ></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="字体颜色" prop="fontColor">
            <el-color-picker v-model="form.fontColor" show-alpha />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- X 和 Y 在同一行 -->
      <el-row :gutter="20">
       
        <el-col :span="12">
          <el-form-item label="字幕 Y 值" prop="y">
            <el-input-number v-model="form.y" :min="0" placeholder="请输入 Y 值"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="字幕 X 值" prop="x">
            <el-input-number v-model="form.x" :min="0" placeholder="请输入 X 值"></el-input-number>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 高度和宽度 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="高度" prop="height">
            <el-input-number v-model="form.height" :min="0" placeholder="请输入高度"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="宽度" prop="width">
            <el-input-number v-model="form.width" :min="0" placeholder="请输入宽度"></el-input-number>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 字幕背景宽度和高度 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="字幕背景高度" prop="subtitleBgHeight">
            <el-input-number v-model="form.subtitleBgHeight" :min="0" placeholder="请输入字幕背景高度"></el-input-number>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="字幕背景宽度" prop="subtitleBgWidth">
            <el-input-number v-model="form.subtitleBgWidth" :min="0" placeholder="请输入字幕背景宽度"></el-input-number>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 控制开关 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="显示字幕">
            <el-switch
              v-model="form.showSubtitle"
              :active-value="1"
              :inactive-value="0"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 提交和重置按钮 -->
      <el-form-item>
        <el-button type="primary" @click="submitForm">提交</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { get, post } from "../utils/request";

const form = ref({
  driver: "",
  height: 1080, // 默认高度
  width: 1920, // 默认宽度
  fontSize: 20, // 默认字体大小
  x: 50, // 默认字幕 X 坐标
  y: 50, // 默认字幕 Y 坐标
  fontColor: "rgba(255, 0, 0, 1)", // 默认字体颜色
  ip: "192.168.1.10", // 默认 IP 地址
  showSubtitle: 1, // 改为数字，1 表示显示，0 表示隐藏
  subtitleBgWidth: 200, // 默认字幕背景宽度
  subtitleBgHeight: 50, // 默认字幕背景高度
});

const formRef = ref(null);

// 获取数据并处理颜色
const getInfo = async () => {
  try {
    const response = await get("/led/getInfo");
    const data = response.data;

    // 转换颜色为 rgba 格式
    const { R, G, B, A } = JSON.parse(data.fontColor);
    const alpha = A / 100; // 将 A 转换为 0-1 的范围
    form.value = {
      ...form.value,
      ...data,
      fontColor: `rgba(${R}, ${G}, ${B}, ${alpha})`, // 转换后的颜色
    };
console.log(form.value);
    ElMessage.success("数据加载成功！");
  } catch (error) {
    console.error("获取数据失败：", error);
    ElMessage.error("数据加载失败，请重试！");
  }
};

// 在组件加载时调用 getInfo
onMounted(() => {
  getInfo();
});

const rules = {
  driver: [{ required: true, message: "请输入屏的型号", trigger: "blur" }],
  height: [{ required: true, message: "请输入高度", trigger: "blur" }],
  width: [{ required: true, message: "请输入宽度", trigger: "blur" }],
  fontSize: [
    { required: true, message: "请输入字体大小", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value % 10 !== 0) {
          callback(new Error("字体大小必须是10的整数倍"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  x: [{ required: true, message: "请输入字幕 X 值", trigger: "blur" }],
  y: [{ required: true, message: "请输入字幕 Y 值", trigger: "blur" }],
  subtitleBgWidth: [{ required: true, message: "请输入字幕背景宽度", trigger: "blur" }],
  ip: [
    { required: true, message: "请输入 IP 地址", trigger: "blur" },
    {
      pattern:
        /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/,
      message: "请输入有效的 IP 地址",
      trigger: "blur",
    },
  ],
};

const submitForm = () => {
  formRef.value.validate((valid) => {
    console.log("表单验证结果：", valid);
    if (valid) {
      // 将字体颜色转换为 { A, R, G, B } 格式
      const rgba = form.value.fontColor.match(/rgba?\((\d+), (\d+), (\d+),? ?([\d.]*)?\)/);
      const colorObject = {
        R: parseInt(rgba[1]),
        G: parseInt(rgba[2]),
        B: parseInt(rgba[3]),
        A: rgba[4] ? parseFloat(rgba[4]) * 100 : 100, // 如果没有 alpha 值，默认为 100
      };

      const postData = { ...form.value, fontColor: colorObject };

      // 发起 POST 请求
      console.log("提交数据：", postData);
      post("/led/updateInfo", postData)
        .then((response) => {
          console.log("服务器响应：", response);
          ElMessage.success("提交成功！");
        })
        .catch((error) => {
          console.error("提交失败：", error);
          ElMessage.error("提交失败，请重试！");
        });
    } else {
      console.log(form);
      ElMessage.error("请填写完整的表单！");
    }
  });
};

const resetForm = () => {
  formRef.value.resetFields();
};

// 根据比例计算 X 坐标
const calculateX = () => {
  const screenWidth = (form.value.width / form.value.height) * 350; // 动态计算屏幕宽度
  return (form.value.x / form.value.width) * screenWidth; // 按比例计算 X 坐标
};

// 根据比例计算 Y 坐标
const calculateY = () => {
  const screenHeight = 350; // 高度固定为 350
  return (form.value.y / form.value.height) * screenHeight // 按比例计算 Y 坐标
};

// 根据比例计算字幕背景宽度
const calculateSubtitleBgWidth = () => {
  const screenWidth = (form.value.width / form.value.height) * 350; // 动态计算屏幕宽度
  return (form.value.subtitleBgWidth / form.value.width) * screenWidth; // 按比例计算字幕背景宽度
};
</script>

<style scoped>

.container1 {
  /* height: 100%; */
  /* display: flex; */
  width: 90%;
  overflow-y: auto;
  flex-direction: column;
  align-items: center;

}
/* .container {
  height: 100%;
  margin: 20px auto;
} */

.led-form {
  max-width: 800px;
  margin: 20px auto;
}

.screen {
  background-color: black;
  position: relative;
  margin: 20px auto;
  border: 2px solid #ccc;
  overflow: hidden;
}

.subtitle {
  position: absolute;
  font-weight: bold;
  white-space: nowrap;
  background-color: rgba(0, 0, 0, 0.5); /* 添加背景颜色 */
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid red; /* 红色边框 */
}
.remark{
  display: block;
  text-align: center;
  font-weight: 800;
  color: #ff0000;
  font-size: 14px;
}
@keyframes scroll {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}
</style>