<template>
  <div class="dashboard">
    <h1 class="title">小迈智能助手</h1>
    <el-row :gutter="20" class="stat-row">
      <!-- 提取公共组件，减少重复代码 -->
      <ApiStatusCard 
        title="语言转文字 api" 
        :status="sttStatus"
      />
      <ApiStatusCard 
        title="ollama api" 
        :status="omStatus"
      />
      <ApiStatusCard 
        title="声纹识别 api" 
        :status="vpStatus"
      />
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-title">系统信息</div>
          <el-icon :style="{ color: getColor(cpuStatus), fontSize: '32px' }" @click="showSystemInfo = true"><Cpu /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card>
          <div ref="barChart" style="height: 240px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div ref="pieChart" style="flex: 1; height: 240px"></div>
        </el-card>
      </el-col>
    </el-row>
    <!-- 添加对话框 -->
    <el-dialog
      v-model="showSystemInfo"
      title="CPU 和 GPU 信息"
      width="30%"
    >
      <div v-if="systemInfo">
        <div>
          <div><strong>CPU 型号:</strong> {{ systemInfo?.cpu?.model }}</div> 
          <div><strong>CPU 速率:</strong> {{ systemInfo?.cpu?.speed }}</div> 
        </div>
        <div v-for="(item, index) in systemInfo?.GPU" :key="index">
          <div><strong>GPU 型号 {{ index + 1 }}:</strong> {{ item.model }}</div>
          <div><strong>GPU 显存 {{ index + 1 }}:</strong> {{ item.vram }} GB</div>
        </div>
      </div>
      <div v-else>
        暂无系统信息
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSystemInfo = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import * as echarts from "echarts";
import { ref, onMounted, watch, nextTick } from "vue";
import { get } from "../utils/request"; 
import { CircleCheck, CircleClose, Loading ,Cpu} from "@element-plus/icons-vue"; 
import {  ElDialog } from "element-plus";
import ApiStatusCard from './ApiStatusCard.vue';

const sttStatus = ref("验证中..."); 
const omStatus = ref("验证中..."); 
const vpStatus = ref("验证中..."); 
const  cpuStatus = ref("验证中..."); 
const barChart = ref(null);
const pieChart = ref(null);
const systemInfo = ref(null); 
const showSystemInfo = ref(false); 

// 精简函数名
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

// 验证语言转文字系统
const checkStt = async () => {
  try {
    const result = await get("/status");
    sttStatus.value = result.data.sttStatus; 
    vpStatus.value = result.data.vpStatus; 
    omStatus.value = result.data.omStatus;
    // 修正获取 systemInfo 的逻辑
    systemInfo.value = result.data.systemInfo.value; 
    console.log('完整 systemInfo 数据:', systemInfo.value); // 打印完整数据确认
    if (systemInfo.value?.memory) {
      console.log('内存数据:', systemInfo.value.memory); // 打印内存数据确认
    }
    cpuStatus.value = "在线";
  } catch (error) {
    console.error("验证失败:", error);
    sttStatus.value = "未开启";
    vpStatus.value = "未开启";
    omStatus.value = "离线";
  }
};

// 初始化饼图
const initPieChart = async () => {
  await nextTick(); // 等待 DOM 更新
  if (!pieChart.value) {
    console.log('Pie chart element is missing');
    return;
  }

  if (!systemInfo.value?.memory) {
    console.log('Memory data is missing');
    return;
  }
  const pie = echarts.init(pieChart.value);
  const freeMemory = systemInfo.value.memory.free;
  const totalMemory = systemInfo.value.memory.total;
  const usedMemory = (Number(totalMemory) - Number(freeMemory)).toFixed(2);

  pie.setOption({
    legend: {
      orient: "vertical",
      x: "right",
      data: [
        `未使用${freeMemory} GB`,
        `已使用${usedMemory} GB`,
      ],
    },
    title: {
      text: `内存状态(${totalMemory} GB)`,
      textStyle: { color: "#000", fontSize: 18 },
    },
    series: [
      {
        name: "内存状态",
        type: "pie",
        radius: ["60%", "80%"],
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: "15",
            fontWeight: "bold",
          },
        },
        data: [
          {
            value: freeMemory,
            name: `未使用${freeMemory} GB`,
            itemStyle: { color: "#008000" },
          },
          {
            value: usedMemory,
            name: `已使用${usedMemory} GB`,
            itemStyle: { color: "#FF4040" },
          },
        ],
      },
    ],
  });
};

// 监听 systemInfo 变化，当数据更新时重新初始化饼图
watch(systemInfo, () => {
  initPieChart();
}, { deep: true });

// 获取历史数据并处理
const fetchHistoryData = async () => {
  try {
    const response = await get("/history/list");
    const historyData = response.data;

    const monthlyData = {};
    historyData.forEach((item) => {
      const date = new Date(item.ctime);
      const yearMonth = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      if (!monthlyData[yearMonth]) {
        monthlyData[yearMonth] = 0;
      }
      monthlyData[yearMonth]++;
    });

    const xAxisData = Object.keys(monthlyData).sort();
    const seriesData = [
      {
        name: "调用次数",
        type: "bar",
        data: xAxisData.map((yearMonth) => monthlyData[yearMonth]),
      },
    ];

    if (barChart.value) {
      const bar = echarts.init(barChart.value);
      bar.setOption({
        title: {
          text: "历史记录",
          left: "center",
          textStyle: { color: "#000", fontSize: 18 },
        },
        // 添加 tooltip 配置
        tooltip: {
          trigger: "axis",
          formatter: "{b} : {c} 次",
        },
        xAxis: {
          type: "category",
          data: xAxisData,
          axisLabel: { color: "#000", rotate: 0 },
        },
        yAxis: {
          type: "value",
          axisLabel: { color: "#000" },
          name: "次数",
        },
        series: seriesData,
      });
    }
  } catch (error) {
    console.error("获取历史数据失败:", error);
  }
};

onMounted(() => {
  checkStt();
  fetchHistoryData();
  // 组件挂载后尝试初始化饼图
  initPieChart(); 
});
</script>

<style scoped>
.dashboard {
  min-height: 60vh;
  color: #000;
}
.title {
  text-align: center;
  font-size: 32px;
  color: #000;
}
.stat-row {
  margin-bottom: 30px;
}
.stat-card {
  text-align: center;
}
.stat-title {
  font-size: 18px;
  margin-bottom: 10px;
}
.stat-value {
  font-size: 40px;
  font-weight: bold;
  color: #4fc3f7;
}
.stat-desc {
  font-size: 14px;
  color: #aaa;
}
.chart-title {
  font-size: 18px;
  color: #000;
}
.pie-cpu-gpu-container {
  display: flex;
  align-items: center; /* 垂直居中对齐 */
}
.system-info-dialog{
  text-align: left;
}
.cpu-gpu-info {
  padding-left: 20px; /* 增加左边距，使信息与饼图有一定间隔 */
  font-size: 14px;
  min-width: 150px; /* 设置最小宽度，避免信息换行 */
}
</style>
