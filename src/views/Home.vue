<template>
  <div class="page">
    <div class="header">
      <div
        @click="isCollapse = !isCollapse"
        class="header_fold"
        :class="isCollapse ? 'on' : 'off'"
      >
        <el-icon>
          <Fold />
        </el-icon>
      </div>
      <div class="header_user">
        <el-dropdown
          v-model:visible="userMenuVisible"
          @command="handleUserMenu"
          trigger="click"
        >
          <div class="el-dropdown-link">
            {{ id }}
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="Profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    <div class="box">
      <el-menu
        :default-active="activeid"
        class="Collapse"
        :class="isCollapse ? 'on' : 'Collapse'"
        :collapse="isCollapse"
      >
        <el-menu-item index="1" @click="jump('/')">
          <el-icon>
            <House />
          </el-icon>
          <template #title>主页</template>
        </el-menu-item>
        <el-sub-menu index="2">
          <template #title>
            <el-icon><HelpFilled /></el-icon>
            <span>工作台</span>
          </template>
          <el-menu-item-group>
            <el-menu-item index="2-model" @click="jump('/SpeechToText')">
              <el-icon><Mic /></el-icon>语音转文字
            </el-menu-item>
            <el-menu-item index="2-history" @click="jump('/History')">
              <el-icon><Timer /></el-icon>历史记录
            </el-menu-item>
          </el-menu-item-group>
        </el-sub-menu>
        <el-sub-menu index="3">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>设置</span>
          </template>
          <el-menu-item-group>
            <el-menu-item index="2-screen" @click="jump('/Model')">
              <el-icon><icon-menu /></el-icon>模式设置
            </el-menu-item>
            <el-menu-item index="3-led" @click="jump('/LED')">
              <el-icon><Edit /></el-icon>大屏设置
            </el-menu-item>
            <el-menu-item index="2-voiceprint" @click="jump('/Voiceprint')">
              <el-icon><View /></el-icon>声纹设置
            </el-menu-item>
            <el-menu-item index="3-HearSetting" @click="jump('/HearSetting')">
              <el-icon><Headset /></el-icon>语音设置
            </el-menu-item>
          </el-menu-item-group>
        </el-sub-menu>
        <el-menu-item index="4" @click="jump('/Profile')">
          <el-icon><Avatar /></el-icon>
          <template #title>个人中心</template>
        </el-menu-item>
      </el-menu>
      <div class="content">
        <div class="outer-container">
          <div class="container">
            <router-view />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { get } from "../utils/request";
const router = useRouter();
const route = useRoute();
import {
  Menu as IconMenu,
  Fold,
  House,
  Edit,
  Setting,
  HelpFilled,
  Mic,
  Avatar,
  Headset,
  View,
  Timer,
} from "@element-plus/icons-vue";
const nav = ref([]);
const jump = (id) => {
  router.push(id);
};
const id = "A";
const activeid = ref();

const isCollapse = ref(false);
const userMenuVisible = ref(false);
const handleUserMenu = (command) => {
  if (command === "Profile") {
    router.push("/Profile"); // 跳转到个人中心页面
  } else if (command === "logout") {
    // 执行退出登录逻辑
    console.log("退出登录");
    localStorage.removeItem("token");
    router.push("/login");
  }
};
</script>
<style scoped>
.page {
  height: 100%;
  width: 100%;
}

.header {
  height: 60px;
  width: 100%;
  line-height: 60px;
  border-bottom: 1px solid #666;
  display: flex;
  justify-content: space-between;
}

.Collapse {
  max-width: 200px;
  height: 100%;
}

.box {
  width: 100%;
  position: absolute;
  top: 61px;
  /* background-color: #00bfff; */
  bottom: 0;
  display: flex;
}

.header_fold {
  margin-left: 20px;
  font-size: 24px;
}

.on {
  color: #00bfff;
}

.off {
  color: #000;
}

.content {
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: #ffffff;
}

.header_user {
  position: relative;
  display: flex;
  line-height: 45px;
}

.el-dropdown-link {
  text-align: center;
  margin: auto 20px;
  background-color: #409eff;
  cursor: pointer;
  border-radius: 50%;
  width: 45px;
  height: 45px;
  font-size: 20px;
  color: #ffffff;
  line-height: 45px;
}
.outer-container {
  overflow-y: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #f5f5f5;
  box-sizing: border-box;
}
.container {
  display: flex;
  flex-direction: column;
  width: 90%;
  padding: 20px;
  height: 90%;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
