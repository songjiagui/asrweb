<template>
  <div class="background-container">
    <div class="login-container">
      <div class="login-left">
        <div class="branding">
          <el-icon :size="80"><Service /> </el-icon>
          <el-icon :size="80"> <Switch /> </el-icon>
          <el-icon :size="80"> <Postcard /></el-icon>
          <h2>实时语音识别系统</h2>
          <p>实时将语音识别为文字。</p>
          <p>接入LED大屏和ai智能系统。</p>
        </div>
      </div>

      <el-card class="login-card" shadow="hover">
        <h2 class="title">登&emsp;录</h2>
        <el-form :model="user" ref="loginForm" label-width="0">
          <el-form-item prop="name">
            <el-input v-model="user.name" placeholder="请输入用户名" clearable>
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="user.password"
              placeholder="请输入密码"
              show-password
              clearable
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <div class="login-options">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
          </div>
          <el-form-item>
            <div class="button-group">
              <el-button type="primary" @click="handleLogin">登录</el-button>
              <el-button @click="handleReset">重置</el-button>
            </div>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { reactive, ref } from "vue";
import { post } from "../utils/request";
import { encipher } from "../utils/Md5";
import { User, Lock } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus"; // 引入消息提示组件
import { Service, Operation, Postcard, Switch } from "@element-plus/icons-vue";
const router = useRouter();
const user = reactive({
  name: "",
  password: "",
});
const rememberMe = ref(false);
const loginForm = ref(null); // 表单引用
const isLoading = ref(false); // 加载状态

// 表单验证规则
const rules = {
  name: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
};

// 初始化时检查是否有记住的密码
const initRememberMe = () => {
  const savedUser = localStorage.getItem("rememberedUser");
  if (savedUser) {
    user.name = savedUser;
    rememberMe.value = true;
  }
};

initRememberMe();

const handleLogin = async () => {
  if (!loginForm.value) return;
  try {
    isLoading.value = true; // 开始加载
    await loginForm.value.validate(); // 验证表单
    console.log(encipher(user.password));
    localStorage.removeItem("token");
    const result = await post("/login", {
      username: user.name,
      password: encipher(user.password),
    });
    if (result.token) {
      localStorage.setItem("token", result.token);
      // 处理记住密码逻辑
      if (rememberMe.value) {
        localStorage.setItem("rememberedUser", user.name);
      } else {
        localStorage.removeItem("rememberedUser");
      }
      router.push("/");
    } else {
      ElMessage.error("密码错误"); // 显示错误消息
    }
  } catch (error) {
    if (error.name === "ValidationError") {
      // 表单验证失败
    } else {
      ElMessage.error("登录失败，请稍后重试"); // 显示错误消息
    }
  } finally {
    isLoading.value = false; // 结束加载
  }
};

const handleReset = () => {
  user.name = "";
  user.password = "";
  if (loginForm.value) {
    loginForm.value.resetFields(); // 重置表单验证状态
  }
};
</script>

<style scoped>
.background-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  color: #fff; /* 设置文字颜色为白色 */
  animation: gradient-background 3s ease infinite;
}

@keyframes gradient-background {
  0% {
    background: linear-gradient(0deg, #e8f2fc, #dfeefc);
  }
  10% {
    background: linear-gradient(36deg, #e8f2fc, #dfeefc);
  }
  20% {
    background: linear-gradient(72deg, #dfeefc, #e8f2fc);
  }
  30% {
    background: linear-gradient(108deg, #dfeefc, #e8f2fc);
  }
  40% {
    background: linear-gradient(144deg, #e8f2fc, #dfeefc);
  }
  50% {
    background: linear-gradient(180deg, #dfeefc, #e8f2fc);
  }
  60% {
    background: linear-gradient(216deg, #e8f2fc, #dfeefc);
  }
  70% {
    background: linear-gradient(252deg, #dfeefc, #dfeefc);
  }
  80% {
    background: linear-gradient(288deg, #dfeefc, #e8f2fc);
  }
  90% {
    background: linear-gradient(324deg, #e8f2fc, #dfeefc);
  }
  100% {
    background: linear-gradient(360deg, #e8f2fc, #dfeefc);
  }
}
.login-container {
  display: flex;
  width: 80%;
  height: 80%;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

.login-container::before {
  content: "";
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  z-index: -1;
  border-radius: 10px;
  background: linear-gradient(45deg, #ff0000, #002fed);
  background-size: 200% 200%;
  animation: gradient-border 3s ease infinite;
}

@keyframes gradient-border {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.login-left {
  flex: 1;
  background-color: #2c3e50;
  color: #fff;
  display: flex;
  border-radius: 8px 0 0 8px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.branding {
  text-align: center;
}

.logo {
  width: 100px;
  margin-bottom: 20px;
}

.login-card {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 400px;
  padding: 20px;
  border-radius: 0 8px 8px 0;
  box-shadow: 10px 10px 16px rgba(0, 0, 0, 0.1);
}

.title {
  text-align: center;
  font-size: 30px;
  color: #333;
}

.login-options {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.login-footer {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #409eff;
}

.login-footer a {
  text-decoration: none;
  color: inherit;
}

.login-footer a:hover {
  text-decoration: underline;
}

.button-group {
  display: flex;
  justify-content: space-between;
}

.el-input {
  width: 300px;
  border: 1px solid #0000009b; /* 添加边框 */
  border-radius: 4px; /* 圆角边框 */
}

.el-input:focus-within {
  border-color: #409eff; /* 聚焦时的边框颜色 */
  box-shadow: 0 0 5px rgba(64, 158, 255, 0.5); /* 聚焦时的阴影效果 */
}
</style>
