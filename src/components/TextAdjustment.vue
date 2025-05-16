<template>
  <template v-if="titlename">
    <div class="name-change">
      <el-input
        v-model="newName"
        placeholder="请输入新的名称"
        style="width: 300px; margin-right: 10px"
      />
      <el-button type="primary" @click="updateName">确定</el-button>
      <el-button type="success" @click="generateOutline">生成提纲</el-button>
    </div>

    <div class="audio-progress-container">
      <div class="audio-progress-bar" @click="seekAudio" ref="progressBar">
        <div
          class="audio-progress-played"
          :style="{ width: `${(currentTime / audioDuration) * 100}%` }"
        ></div>
        <div
          class="audio-progress-slider"
          :style="{ left: `${(currentTime / audioDuration) * 100}%` }"
          @mousedown="startDragging"
        ></div>
      </div>
      <div class="audio-progress-time">
        <span>{{ formatTime(currentTime) }}</span>
        <span>/</span>
        <span>{{ formatTime(audioDuration) }}</span>
      </div>
    </div>

    <div class="audio-controls">
      <el-icon size="30px" @click="rewind">
        <CaretLeft />
      </el-icon>
      <el-icon
        v-if="!isPlaying"
        size="30px"
        color="#FF0000"
        @click="togglePlay"
      >
        <VideoPlay />
      </el-icon>
      <el-icon v-else size="30px" color="#409eff" @click="togglePlay">
        <VideoPause />
      </el-icon>
      <el-icon size="30px" @click="forward">
        <CaretRight />
      </el-icon>
      <el-select
        v-model="playbackRate"
        @change="updatePlaybackRate"
        class="speed-select"
        placeholder="倍速"
      >
        <el-option
          v-for="rate in playbackRates"
          :key="rate"
          :label="`${rate}x`"
          :value="rate"
        />
      </el-select>
    </div>
    <GenerateOutline
      :name="titlename"
      :dialogVisible="outlineDialogVisible"
      @close="outlineDialogVisible = false"
    />
    <div class="subtitles" ref="subtitlesContainer">
      <p
        v-for="(subtitle, index) in subtitles"
        :key="index"
        :class="getSubtitleClass(index)"
        @dblclick="editSubtitle(index)"
        @click="jumpToSubtitle(index)"
        :ref="(el) => (subtitleRefs[index] = el)"
      >
        <span v-if="editingIndex !== index">{{ subtitle.text }}</span>
        <textarea
          v-else
          v-model="subtitle.text"
          @blur="finishEditing(index)"
          @keydown.enter.prevent="finishEditing(index)"
        ></textarea>
      </p>
    </div>

    <audio
      ref="audio"
      @timeupdate="syncSubtitles"
      @ended="handleAudioEnded"
      style="display: none"
    >
      <source
        :src="`http://127.0.0.1:4001/file/${newName}.wav`"
        type="audio/mpeg"
      />
    </audio>
  </template>
  <template v-else>
    <p class="no-record-message">请选择需要修改的记录</p>
  </template>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { get, put } from "../utils/request";
import {
  VideoPlay,
  VideoPause,
  CaretLeft,
  CaretRight,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import GenerateOutline from "./GenerateOutline.vue";
const route = useRoute();
const router = useRouter();
const titlename = route.query.name;
const newName = ref(titlename);
const subtitles = reactive([]);
const audio = ref(null);
const currentSubtitleIndex = ref(0);
const editingIndex = ref(null);
const subtitlesContainer = ref(null);
const subtitleRefs = reactive([]);
const currentTime = ref(0);
const audioDuration = ref(0);
const progressBar = ref(null);
const isDragging = ref(false);
const isPlaying = ref(false);
const playbackRate = ref(1.0);
const playbackRates = [0.5, 1.0, 1.5, 2.0, 3.0, 5.0, 8.0];
const translation = ref({});
// 获取字幕数据
const fetchSubtitles = async () => {
  try {
    const response = await get("/history/Subtitle", { name: route.query.name });
    subtitles.splice(0, subtitles.length, ...response.data.segments); // 更新 reactive 的数组
    translation.value = response.data.translation; // 更新翻译数据
  } catch (error) {
    console.error("获取字幕数据失败：", error);
  }
};

function syncSubtitles() {
  if (audio.value && !isDragging.value) {
    currentTime.value = Math.floor(audio.value.currentTime);
    audioDuration.value = Math.floor(audio.value.duration || 0);
  }
  const closestIndex = subtitles.reduce((closest, subtitle, index) => {
    const diff = Math.abs(currentTime.value - subtitle.start);
    return diff <
      Math.abs(currentTime.value - subtitles[closest]?.start || Infinity)
      ? index
      : closest;
  }, -1);
  currentSubtitleIndex.value = closestIndex;
  if (closestIndex !== -1) {
    nextTick(() => {
      const activeSubtitle = subtitleRefs[closestIndex];
      if (activeSubtitle && subtitlesContainer.value) {
        subtitlesContainer.value.scrollTo({
          top: activeSubtitle.offsetTop - subtitlesContainer.value.offsetTop,
          behavior: "smooth",
        });
      }
    });
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function seekAudio(event) {
  if (audio.value && progressBar.value) {
    const rect = progressBar.value.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const newTime = (offsetX / rect.width) * audioDuration.value;
    audio.value.currentTime = newTime;
    currentTime.value = Math.floor(newTime);
  }
}

function startDragging() {
  isDragging.value = true;
  document.addEventListener("mousemove", onDragging);
  document.addEventListener("mouseup", stopDragging);
}

function onDragging(event) {
  if (progressBar.value && audio.value) {
    const rect = progressBar.value.getBoundingClientRect();
    const offsetX = Math.min(
      Math.max(event.clientX - rect.left, 0),
      rect.width
    );
    const newTime = (offsetX / rect.width) * audioDuration.value;
    currentTime.value = Math.floor(newTime);
  }
}

function stopDragging() {
  if (audio.value) {
    audio.value.currentTime = currentTime.value;
  }
  isDragging.value = false;
  document.removeEventListener("mousemove", onDragging);
  document.removeEventListener("mouseup", stopDragging);
}

function togglePlay() {
  if (audio.value) {
    isPlaying.value ? audio.value.pause() : audio.value.play();
    isPlaying.value = !isPlaying.value;
  }
}

function handleAudioEnded() {
  isPlaying.value = false; // 音频播放结束时关闭播放开关
}

function editSubtitle(index) {
  editingIndex.value = index;
}

function finishEditing(index) {
  editingIndex.value = null;
}

async function updateName() {
  try {
    const segments = subtitles.map((subtitle) => ({
      start: subtitle.start,
      end: subtitle.end,
      text: subtitle.text,
    }));
    const jsonData = {
      segments: segments,
    };
    await put("/history/modify", {
      oldName: titlename,
      newName: newName.value,
      jsonData,
    });

    ElMessage.success("名称和字幕更新成功");
    router.push({ name: "TextAdjustment", query: { name: newName.value } });
  } catch (error) {
    ElMessage.error("更新失败，请重试");
  }
}

function jumpToSubtitle(index) {
  if (audio.value) {
    const subtitle = subtitles[index];
    if (subtitle) {
      audio.value.currentTime = subtitle.start;
      currentTime.value = Math.floor(subtitle.start);
    }
  }
}

function rewind() {
  if (audio.value) {
    audio.value.currentTime = Math.max(0, audio.value.currentTime - 5);
  }
}

function forward() {
  if (audio.value) {
    audio.value.currentTime = Math.min(
      audioDuration.value,
      audio.value.currentTime + 5
    );
  }
}

function updatePlaybackRate() {
  if (audio.value) {
    audio.value.playbackRate = playbackRate.value;
  }
}
const outlineDialogVisible = ref(false); // 控制生成提纲对话框的显示状态
function generateOutline() {
  outlineDialogVisible.value = true; // 打开对话框
}

function getSubtitleClass(index) {
  return {
    active:
      index === currentSubtitleIndex.value && editingIndex.value !== index,
    editing: index === editingIndex.value,
    modified: subtitles[index]?.modified,
  };
}

onMounted(() => {
  fetchSubtitles(); // 加载字幕数据
  document.addEventListener("mouseup", stopDragging);
});

onBeforeUnmount(() => {
  document.removeEventListener("mouseup", stopDragging);
});
</script>

<style scoped>
.name-change {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.audio-progress-container {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.audio-progress-bar {
  flex: 1;
  position: relative;
  height: 10px;
  background-color: green;
  border-radius: 5px;
  overflow: hidden;
  cursor: pointer;
}

.audio-progress-played {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: red;
  transition: width 0.1s linear;
}

.audio-progress-slider {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 24px;
  background-color: black;
  border-radius: 2px;
  transform: translate(-50%, -50%);
  cursor: pointer;
}

.audio-progress-time {
  margin-left: 10px;
  font-size: 14px;
  user-select: none;
}

.audio-controls {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  justify-content: center;
}

.play-button,
.rewind-button,
.forward-button {
  margin-right: 10px;
}

.speed-select {
  width: 100px;
  margin-right: 10px;
}

.subtitles {
  margin-top: 20px;
  font-size: 16px;
  line-height: 1.5;
  max-height: 500px;
  overflow-y: auto;
}

.subtitles p {
  margin: 0;
  opacity: 0.5;
  transition: opacity 0.3s, color 0.3s;
}

.subtitles p.active {
  opacity: 1;
  color: blue;
  font-weight: bold;
}

.subtitles p.editing {
  color: black;
  opacity: 2;
}

.subtitles p.modified {
  color: red;
}

.subtitles textarea {
  width: 100%;
  font-size: 16px;
  line-height: 1.5;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 4px;
  resize: none;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
}

.no-record-message {
  font-size: 18px;
  color: #666;
  text-align: center;
  margin-top: 20px;
}

.el-icon {
  margin: 0 10px;
}
</style>
