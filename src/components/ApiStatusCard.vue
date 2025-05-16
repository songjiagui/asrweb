<template>
  <el-col :span="6">
    <el-card class="stat-card">
      <div class="stat-title">{{ title }}</div>
      <el-icon :style="{ color: getColor(status), fontSize: '32px' }">
        <template v-if="status === '验证中...'"><Loading /></template>
        <template v-if="status === '已开启' || status === '在线'"><CircleCheck /></template>
        <template v-if="status === '未开启' || status === '离线'"><CircleClose /></template>
      </el-icon>
    </el-card>
  </el-col>
</template>

<script setup>
import { CircleCheck, CircleClose, Loading } from "@element-plus/icons-vue"; 
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  }
});

const getColor = (status) => {
  const colorMap = {
    "验证中...": "DeepSkyBlue",
    "已开启": "green",
    "在线": "green",
    "未开启": "red",
    "离线": "red"
  };
  return colorMap[status] || "black";
};
</script>

<style scoped>
.stat-card {
  text-align: center;
}
.stat-title {
  font-size: 18px;
  margin-bottom: 10px;
}
</style>
