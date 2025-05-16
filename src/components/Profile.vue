<template>
    <div class="full-width">
      <div class="profile-header">
        <el-avatar size="large" src="https://via.placeholder.com/150" />
        <div class="profile-info">
          <h2>{{ username }}</h2>
          <p>{{ email }}</p>
        </div>
      </div>
      <el-button type="primary" @click="editProfile">编辑个人信息</el-button>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const username = ref('张三');
const email = ref('zhangsan@example.com');

function editProfile() {
  // 编辑个人信息逻辑
  console.log('编辑个人信息');
}
</script>

<style scoped>

.full-width {
  width: 100%;
  height: 100%;
}

.profile-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.profile-info {
  margin-left: 15px;
}

.profile-info h2 {
  margin: 0;
  font-size: 20px;
}

.profile-info p {
  margin: 0;
  color: #666;
}
</style>