<template>
  <div class="model-container">
    <div class="model-header">
      <!-- 设备型号筛选 -->
      <el-select
        v-model="selectedDriver"
        placeholder="请选择设备型号"
        @change="filterByDriver"
        style="margin-right: 10px"
      >
        <el-option
          v-for="driver in driverOptions"
          :key="driver.value"
          :label="driver.name"
          :value="driver.value"
        />
      </el-select>

      <!-- 添加模式按钮 -->
      <el-button type="primary" @click="openSaveDialog('add')" class="addmodel"
        >添加模式</el-button
      >
    </div>

    <!-- 模式表格 -->
    <el-table :data="paginatedData" style="width: 100%" border>
      <el-table-column prop="id" label="ID"></el-table-column>
      <el-table-column prop="name" label="模式名称"></el-table-column>
      <el-table-column prop="driver" label="设备型号"></el-table-column>
      <el-table-column prop="createdAt" label="创建时间"></el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <el-button size="small" type="primary" @click="applyMode(scope.row)"
            >应用</el-button
          >
          <el-button
            size="small"
            type="success"
            @click="openSaveDialog('edit', scope.row)"
          >
            <el-icon size="16px"><EditPen /></el-icon>
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="confirmDelete(scope.row)"
          >
            <el-icon size="16px"><DeleteFilled /></el-icon>
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="currentPage"
      :page-size="pageSize"
      :total="filteredTableData.length"
      layout="sizes, prev, pager, next"
      :page-sizes="[5, 10, 15, 20]"
      @current-change="handlePageChange"
      @size-change="handlePageSizeChange"
    />

    <!-- 保存模式对话框 -->
    <el-dialog v-model="saveDialogVisible" :title="dialogTitle" width="500px">
      <el-form label-width="100px" class="dialog-form">
        <el-form-item label="模式名称">
          <el-input v-model="saveName" placeholder="请输入模式名称" />
        </el-form-item>
        <el-form-item label="设备型号">
          <!-- 添加 disabled 属性 -->
          <el-select
            v-model="saveDriver"
            placeholder="请选择设备型号"
            :disabled="isEdit"
          >
            <el-option
              v-for="driver in driverOptions"
              :key="driver.value"
              :label="driver.name"
              :value="driver.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="索引">
          <!-- 添加 disabled 属性 -->
          <el-input-number
            v-model="saveIndex"
            placeholder="请输入索引"
            :min="1"
            :max="12"
            :disabled="isEdit"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTable">保存</el-button>
      </template>
    </el-dialog>

    <!-- 确认删除对话框 -->
    <el-dialog v-model="confirmDeleteDialogVisible" title="确认删除">
      <span>确定要删除该模式吗？</span>
      <template #footer>
        <el-button @click="confirmDeleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleDelete">删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { DeleteFilled, EditPen } from "@element-plus/icons-vue";
import { get, post, del, put } from "../utils/request";
import { ElMessage, ElMessageBox } from "element-plus"; // 引入 ElMessageBox

const tableData = ref([]);
const filteredTableData = ref([]);
const paginatedData = ref([]);
const driverOptions = [
  { name: "诺瓦H系列", value: "H" },
  { name: "诺瓦V系列", value: "V" },
];
const driverMap = { H: "诺瓦H系列", V: "诺瓦V系列" };

const selectedDriver = ref(null);
const saveDialogVisible = ref(false);
const confirmDeleteDialogVisible = ref(false);
const saveName = ref("");
const saveDriver = ref("");
const saveIndex = ref(null);
const currentRowIndex = ref(null);
const dialogTitle = ref("添加模式");
const currentPage = ref(1);
const pageSize = ref(10);

const fetchModes = async () => {
  try {
    const response = await get("/mode");
    tableData.value = response.data.map((item) => ({
      id: item.index,
      name: item.name,
      driver: driverMap[item.driver] || item.driver,
      driverValue: item.driver,
      createdAt: new Date(item.time).toLocaleString(),
    }));
    filteredTableData.value = tableData.value;
    const getInfo = await get("/led/getInfo");
    const data = getInfo.data;
    selectedDriver.value = data.driver;
    updatePaginatedData();
    ElMessage.success("数据加载成功");
    filterByDriver();
  } catch (error) {
    const errorMessage = error.response?.data?.msg || "未知错误";
    console.error("获取模式数据失败：", errorMessage);
    ElMessage.error(`数据加载失败，错误原因: ${errorMessage}`);
  }
};

const filterByDriver = () => {
  filteredTableData.value = selectedDriver.value
    ? tableData.value.filter(
        (item) => item.driverValue === selectedDriver.value
      )
    : tableData.value;
  updatePaginatedData();
};

const updatePaginatedData = () => {
  const start = (currentPage.value - 1) * pageSize.value;
  paginatedData.value = filteredTableData.value.slice(
    start,
    start + pageSize.value
  );
};

const handlePageChange = (page) => {
  currentPage.value = page;
  updatePaginatedData();
};

const handlePageSizeChange = (size) => {
  pageSize.value = size;
  updatePaginatedData();
};

const isEdit = ref(false); // 新增响应式变量，用于判断是否为编辑状态

const openSaveDialog = (type, row) => {
  dialogTitle.value = type === "add" ? "添加模式" : "修改模式";
  isEdit.value = type === "edit"; // 设置编辑状态
  if (type === "edit") {
    saveName.value = row.name;
    saveDriver.value = row.driverValue;
    saveIndex.value = row.id;
    currentRowIndex.value = row.id;
  } else {
    saveName.value = "";
    saveDriver.value = "";
    saveIndex.value = null;
    currentRowIndex.value = null;
  }
  saveDialogVisible.value = true;
};

const saveTable = async () => {
  const payload = {
    name: saveName.value,
    driver: saveDriver.value,
    index: saveIndex.value,
  };
  try {
    if (currentRowIndex.value === null) {
      await post("/mode/add", payload);
      ElMessage.success("模式添加成功");
    } else {
      await put("/mode/update", payload);
      ElMessage.success("模式更新成功");
    }
    saveDialogVisible.value = false;
    fetchModes();
  } catch (error) {
    const errorMessage = error.response?.data?.msg || "未知错误";
    console.error("保存模式失败：", errorMessage);
    ElMessage.error(`保存模式失败，错误原因: ${errorMessage}`);
  }
};

const confirmDelete = (e) => {
  currentRowIndex.value = e;
  confirmDeleteDialogVisible.value = true;
};

const handleDelete = async () => {
  try {
    const { driverValue: driver, id: index } = currentRowIndex.value;
    await del("/mode/delete", { driver, index });
    ElMessage.success("模式删除成功");
    confirmDeleteDialogVisible.value = false;
    fetchModes();
  } catch (error) {
    const errorMessage = error.response?.data?.msg || "未知错误";
    if (error !== "cancel") {
      console.error("删除模式失败：", errorMessage);
      ElMessage.error(`删除模式失败，错误原因: ${errorMessage}`);
    }
    confirmDeleteDialogVisible.value = false;
  }
};

const applyMode = async (e) => {
  ElMessageBox.confirm("确定要应用该模式吗？此操作不可逆！", "确认应用", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      try {
        // 用户确认应用模式
        const payload = {
          driver: e.driverValue,
          index: e.id,
        };
        await post("/mode/invoke", payload);
        ElMessage.success("模式应用成功");
      } catch (error) {
        const errorMessage = error.response?.data?.msg || "未知错误";
        console.error("应用模式失败：", errorMessage);
        ElMessage.error("应用模式失败，错误原因:" + errorMessage);
      }
    })
    .catch(() => {
      // 用户取消应用模式
      ElMessage.info("已取消应用模式");
    });
};

onMounted(fetchModes);
</script>

<style scoped>
.model-container {
  display: flex;
  margin-bottom: 20px;
  flex-direction: column;
}
.model-header {
  display: flex;
  margin-bottom: 20px;
  flex-direction: row;
}
.addmodel {
  width: 100px;
  margin-bottom: 20px;
}
</style>
