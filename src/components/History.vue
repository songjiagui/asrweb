<template>
  <div class="filter-container">
    <el-date-picker v-model="filterDate" type="daterange" range-separator="至" start-placeholder="开始日期"
      end-placeholder="结束日期" @change="filterByDate" />
    <el-input v-model="searchQuery" placeholder="请输入名称搜索" clearable @input="filterBySearch"
      style="width: 300px; margin-left: 10px" />
  </div>

  <!-- 表格 -->
  <el-table :data="paginatedData" style="width: 100%" border>
    <el-table-column prop="name" label="名称" sortable />
    <el-table-column prop="time" label="创建时间" sortable />
    <el-table-column prop="ctime" label="修改时间" sortable />
    <el-table-column label="操作">
      <template #default="scope">
        <el-button type="danger" size="small" @click="confirmDelete(scope.$index)">
          <el-icon size="18px">
            <DeleteFilled />
          </el-icon>
        </el-button>
        <el-button type="primary" size="small" @click="exportItem(scope.row)">
          <el-icon size="18px">
            <Download />
          </el-icon>
        </el-button>
        <el-button type="success" size="small" @click="navigateToTextAdjustment(scope.row.name)">
          <el-icon size="18px">
            <EditPen />
          </el-icon>
        </el-button>
        <el-button type="warning" size="small" @click="generateOutline(scope.row)">
          生成提纲
        </el-button>
      </template>
    </el-table-column>
  </el-table>

  <DownloadDialog
    :name="titlename"
    :dialogVisible="downloadDialogVisible"
    @close="downloadDialogVisible = false"    
  />

  <!-- 生成提纲对话框 -->
<GenerateOutline
    :name="titlename"
    :dialogVisible="outlineDialogVisible"
    @close="outlineDialogVisible = false"
  />

  <!-- 分页 -->
  <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="filteredData.length"
    layout="sizes, prev, pager, next" :page-sizes="[5, 10, 15, 20, 25]" @current-change="handlePageChange"
    @size-change="handlePageSizeChange" />
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import { get, del } from "../utils/request";
import { DeleteFilled, Download, EditPen } from "@element-plus/icons-vue";
import GenerateOutline from "./GenerateOutline.vue"; // 引入生成提纲组件
import DownloadDialog from "./DownloadDialog.vue"; // 引入下载对话框组件
const router = useRouter();
const titlename = ref(""); // 页面标题
const tableData = ref([]); // 表格数据
const filteredData = ref([]); // 筛选后的数据
const filterDate = ref(null); // 日期筛选
const searchQuery = ref(""); // 搜索关键字

const downloadDialogVisible = ref(false); // 控制下载对话框显示
const outlineDialogVisible = ref(false); // 控制生成提纲对话框显示
let currentRow = null; // 当前选中的行

// 获取历史记录数据
const fetchHistoryData = async () => {
  try {
    const response = await get("/history/list");
    tableData.value = response.data; // 假设接口返回的数据是数组
    filteredData.value = [...tableData.value]; // 初始化筛选数据
    ElMessage.success("历史记录加载成功");
  } catch (error) {
    console.error("获取历史记录失败：", error);
    ElMessage.error("历史记录加载失败，请重试");
  }
};

// 日期筛选
const filterByDate = () => {
  if (!filterDate.value) {
    filteredData.value = [...tableData.value];
    return;
  }
  const [start, end] = filterDate.value;
  const endOfDay = new Date(end);
  endOfDay.setHours(23, 59, 59, 999); // 设置为当天的晚上 23:59:59
  filteredData.value = tableData.value.filter((item) => {
    const itemDate = new Date(item.time);
    return itemDate >= new Date(start) && itemDate <= endOfDay;
  });
};

// 搜索筛选
const filterBySearch = () => {
  const query = searchQuery.value.toLowerCase();
  filteredData.value = tableData.value.filter((item) =>
    item.name.toLowerCase().includes(query)
  );
};

// 删除记录
const confirmDelete = (index) => {
  const row = tableData.value[index]; // 获取当前行数据
  ElMessageBox.confirm("确定要删除这条记录吗？删除后相应的数据也会消失！！", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      try {
        await del("/history/delete", { name: row.name }); // 发送删除请求
        tableData.value.splice(index, 1); // 从表格中移除数据
        filterByDate(); // 更新筛选后的数据
        ElMessage.success("删除成功");
      } catch (error) {
        console.error("删除失败：", error);
        ElMessage.error("删除失败，请重试");
      }
    })
    .catch(() => {
      ElMessage.info("已取消删除");
    });
};

// 导出记录
const exportItem = (row) => {
  currentRow = row; // 保存当前行数据
  titlename.value = row.name;
  downloadDialogVisible.value = true; // 打开对话框
};

// 跳转到文本调整页面
const navigateToTextAdjustment = (name) => {
  router.push({ name: "TextAdjustment", query: { name } });
};

// 生成提纲
const generateOutline = (row) => {
  outlineDialogVisible.value = true; // 打开对话框
  titlename.value = row.name; // 保存当前行数据
  console.log("生成提纲：", row.name);
};

// 分页
const currentPage = ref(1);
const pageSize = ref(10);

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredData.value.slice(start, end);
});

const handlePageChange = (page) => {
  currentPage.value = page;
};

const handlePageSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1; // 重置到第一页
};

// 在组件加载时获取数据
onMounted(() => {
  fetchHistoryData();
});
</script>

<style scoped>
.filter-container {
  /* overflow-y: auto; */
  margin-bottom: 20px;
  display: flex;
  width: 50%;
}

.el-table {
  table-layout: fixed;
  /* 表格宽度撑满容器 */
  /* 自动调整列宽 */
}

.download-options {
  display: flex;
  gap: 10px;
  flex-wrap: nowrap;
  flex-direction: row;
  justify-content: center;
}
</style>
