<template>
    <div class="wrapper">
      <div class="task">
        <el-autocomplete v-model="state1" :fetch-suggestions="querySearch" clearable class="search" placeholder="请输入编号"
          @select="handleSelect" value-key="id">
          <template #default="{ item }">
            <div class="value">{{ item.id }}</div>
            <span class="link">{{ item.Name }}</span>
          </template>
        </el-autocomplete>
        <el-button type="primary" class="add"  @click="up" :icon="DocumentAdd">
          添加
        </el-button>
      </div>
      <History:tableData="tableData" v-if="show" @changeMsg="changeMsg" />
    </div>
  </template>
  
  <script setup>
  import { useRoute, useRouter } from "vue-router";
  import { get } from "../utils/request";
  import History from "../components/History.vue";
  import { watch, ref, nextTick } from "vue";
  import { DocumentAdd } from "@element-plus/icons-vue";
  import { add,nav } from "../utils/index";
  const route = useRoute();
  const active = ref(false);
  const state1 = ref("");
  const show = ref(true);
  const tableData = ref();
  const Pagelist = ref();
  const querySearch = (queryString, cb) => {
    const results = queryString
      ? restaurants.value.filter(createFilter(queryString))
      : restaurants.value;
    cb(results);
    tableData.value = results;
  };
  const handleSelect = (e) => {
    let arr = [];
    arr.push(e);
    tableData.value = arr;
  };
  const createFilter = (queryString) => {
    return (restaurant) => {
      return restaurant.id.toLowerCase().indexOf(queryString.toLowerCase()) === 0;
    };
  };
  const changeMsg = (e) => {
    Pagelist.value = e;
  };
  
  
  const up = () => {
    try {
      const jsondata = window.sessionStorage.getItem(route.fullPath);
      const result = add(jsondata, Pagelist.value)
      window.sessionStorage.setItem(route.fullPath, JSON.stringify(result))
      ElMessage.success("操作成功");
    } catch {
      active.value = false
      ElMessage.error("请选择数据");
    }
  };
  const restaurants = ref([]);
  const devicelist = async () => {
    try {
      const id = route.params.id;
      const t = await get("/device", { id });
      restaurants.value = t.data;
      tableData.value = restaurants.value;
    } catch {
      ElMessage.error("请求失败，请联系相关人员");
    }
  };
  devicelist();
  watch(route, () => {
    const full = nav.find((elem) => elem.id === route.fullPath);
    if (full) {
      show.value = false;
      nextTick(() => {
        devicelist();
        show.value = true;
      });
    }
  });
  </script>
  
  <style scoped>
  .wrapper {
    height: 100%;
    width: 100%;
  }
  
  .task {
    max-width: 90%;
    height: 50px;
    line-height: 50px;
    background-color: #fff;
    border: 1px solid #d4d4d4;
    margin: 20px auto 0 auto;
    display: flex;
    align-items: center;
    box-shadow: 6px 6px 10px #999;
    justify-content: space-between;
  }
  
  ::v-deep .task .el-autocomplete {
    margin-left: 20px;
  }
  
  .add {
    margin-right: 20px;
  }
  </style>
  