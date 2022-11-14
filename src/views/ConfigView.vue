<template>
  <div class="flex-container">
    <div>
      <div class="title-font">公共仓库</div>
      <el-input v-model="configStore.config.repository.name" disabled="true" style="margin-top: 5px;width: 60%" />
    </div>
    <div class="flex-box">
      <span class="title-font">私人仓库: </span>
      <el-button :icon="Plus" type="primary" circle @click="addUserConfigFlag=true" />
    </div>
    <div class="user-repo-box">
      <el-form v-show="userConfig?.length === 0 || addUserConfigFlag">
        <el-form-item label="仓库名称">
          <el-input v-model="newConf.name" />
        </el-form-item>
        <el-form-item label="仓库密码">
          <el-input v-model="newConf.password" />
        </el-form-item>
        <el-form-item label="单词分类">
          <div style="margin-bottom: 8px;" v-show="isNewClass">
            <el-input v-model="newClass" @keydown.enter="addClass" ref="inputClass" style="width: 280px;"></el-input>
            <el-button style="margin-left: 10px;" @click="addClass">添加</el-button>
          </div>
          <br />
          <el-checkbox-group v-model="newConf.classes">
            <el-checkbox-button label="absorb">
              已掌握
            </el-checkbox-button>
            <el-checkbox-button label="non_absorb">
              未掌握
            </el-checkbox-button>
            <span v-for="item in newConf.classes">
              <span v-if="item !== 'absorb' && item !== 'non_absorb'">
                <el-checkbox-button :label="item">
                </el-checkbox-button>
              </span>
            </span>
          </el-checkbox-group>
          <el-button :icon="Plus" style="position: relative;left: 10px;"
                     @click="isNewClass = true" v-show="!isNewClass" />
        </el-form-item>
        <div style="text-align: center;margin-top: 10px;">
          <el-button type="primary" @click="addUserConfig">提交</el-button>
          <el-button type="primary" @click="addUserConfigFlag = false" v-if="userConfig?.length !== 0">取消</el-button>
        </div>
      </el-form>
      <div class="scroll-box">
        <el-scrollbar>
          <el-collapse v-if="userConfig?.length !== 0" v-for="(item, index) in userConfig" v-show="!addUserConfigFlag">
            <el-collapse-item :title="item.name" :name="index">
          <span v-for="i in item.classes">
            <el-tag
              style="margin-right: 6px;">{{ i === "non_absorb" ? "未掌握" : (i === "absorb" ? "掌握" : i) }}</el-tag>
          </span>
            </el-collapse-item>
          </el-collapse>
        </el-scrollbar>
      </div>
    </div>
    <div class="button-flex-container">
      <div>
        <el-button type="primary" @click="saveConfig" v-show="userConfig?.length !== 0 && !addUserConfigFlag">保存
        </el-button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const appDiv = document.getElementById("app")
if (appDiv) {
  appDiv.style.padding = '0'
  appDiv.style.width = '100%'
  appDiv.style.height = '100%'
}
import type { Config, UserConfig } from "@/interface/typings";
import { Plus, User } from "@element-plus/icons-vue";
import type {Ref} from 'vue';
import { configCounterStore } from "@/stores/counter";
import { computed, nextTick, ref } from "vue";
import { ElInput, ElMessage } from "element-plus";
import router from "@/router";
import { ipcRenderer } from "electron";
// 设置背景不为透明
const bodyEle = document.getElementById("first_body")
if (bodyEle)
  bodyEle.style.backgroundColor = "#fff"
// 公共的配置变量
const configStore = configCounterStore();
// 子项
let userConfig1: Ref<UserConfig[] | null | undefined> = ref(null)
const userConfig = computed({
  get() {
    userConfig1.value = configStore.config.user;
    if (userConfig1.value == undefined)
      userConfig1.value = []
    return userConfig1.value;
  },
  set(newValue) {
    userConfig1.value = newValue
  },
})
// 添加新项目时候启用
const addUserConfigFlag:Ref<boolean> = ref(false)
const newConf: Ref<UserConfig> = ref({
  name: '',
  password: '',
  classes: [],
  counter: 0
})
const newClass:Ref<string> = ref('') // 新的分类
const inputClass =  ref<InstanceType<typeof ElInput> | null>(null);
const isNewClass:Ref<boolean> = ref(false);
// 添加自定义分类
function addClass() {
  if (newClass.value.match("[0-9a-zA-z]+")) {
    newConf.value.classes.push(newClass.value);
    inputClass.value?.clear();
    isNewClass.value = false;
  } else {
    ElMessage.error("分类只能含有数字和英语")
    inputClass.value?.clear()
  }
}

// 配置修改完成
function addUserConfig() {
  userConfig1.value?.push(newConf.value);
  if (userConfig1.value != null)
    userConfig.value = userConfig1.value;
  newConf.value = {
    name: '',
    password: '',
    classes: [],
    counter: 0
  }
  addUserConfigFlag.value = false;
}
// 保存配置
function saveConfig() {
  let newConf = configStore.config;
  newConf.user = userConfig.value;
  configStore.setConfig(newConf)
  ipcRenderer.send("config-set", JSON.stringify(configStore.config))
  ipcRenderer.send("main-show")
  router.back()
}
</script>

<style scoped>

.button-flex-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  position: absolute;
  bottom: 14px;
  width: 100%;
  height: 20%;
}

.flex-container {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  margin: 20px;
  height: 100%;
}

.flex-box {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.title-font {
  font-size: 20px;
  font-weight: bold;
  margin-right: 16px;
}

:global(#app) {
  position: fixed;
  width: 100%;
  height: 100%;
  padding: 1rem;
}

.user-repo-box {
  flex-grow: 0;
  height: 48%;
  margin-top: 13px;
  width: 100%;
}

.scroll-box {
  width: 100%;
  height: 100%;
}

.el-collapse {
  width:100%;
}
</style>
