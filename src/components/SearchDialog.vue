<template>
  <el-dialog draggable destroy-on-close
             style="--el-dialog-bg-color: rgba(0,0,0,0.6);width: 80%;height: 70%;--el-header-height: 1px;--el-dialog-padding-primary: 0px;"
             :show-close="false" @keydown.enter.prevent="searchStart" @open="focusOn">
    <template #header>
      <div style="height: 1px;">
        <slot name="title"></slot>
      </div>
    </template>
    <div class="search-box">
      <el-form :inline="true">
        <el-form-item label-width="0">
            <el-col :span="24">
              <el-input v-model="searchWord" :suffix-icon="Search" :clearable="true" @input="trySearch" ref="searchInput">
              </el-input>
            </el-col>
        </el-form-item>
      </el-form>
    </div>
    <el-descriptions border :column="1" style="margin-left: 20px;margin-right: 20px;"
                     v-show="showResult" v-loading="loading" element-loading-background="transparent">
      <template #title>
        {{searchWord}}
        <el-switch :active-icon="Star" v-model="isStar" inline-prompt @change="starChange">
        </el-switch>
      </template>
      <el-descriptions-item label="释义">
        <div>
          <show-means-pop :ellipsis="true" :explains="result.basic.explains" />
        </div>
      </el-descriptions-item>
      <el-descriptions-item label="发音">
        <el-button link @click="playVideo(result.basic['uk-speech'])"
                   v-show="result.basic['uk-speech'] !== '' ">[{{result.basic.phonetic}}]</el-button>
      </el-descriptions-item>
    </el-descriptions>
  </el-dialog>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";
import type { Ref } from "vue";
import {Search, Star} from "@element-plus/icons-vue";
import {searchReq} from "@/api/axios";
import type { Word,SearchResult } from "@/interface/typings";
import ShowMeansPop from "@/components/ShowMeansPop.vue";
import { ElInput } from "element-plus";
import { mongooseCollectionStore, mongooseDefaultStore } from "@/stores/mongoose";

const searchWord:Ref<string> = ref('')
const showResult:Ref<boolean> = ref(false)
const loading:Ref<boolean> = ref(true)

//  获得传递的单词信息
const prop = defineProps<
  { words?: Word[], wordList?: string[], collectionList?: any}
  >()

// 聚焦搜索框
const searchInput = ref<InstanceType<typeof ElInput> | null>(null)
function focusOn() {
  nextTick(() => {searchInput.value?.focus()}) // nextTick必要的
}

// 默认搜索结果（用于重置搜索）
const constResult: SearchResult = {
  basic: {
    exam_type: [],
    explains: [],
    phonetic: '',
    "uk-phonetic": '',
    "uk-speech": '',
    "us-phonetic": '',
    "us-speech": '',
    wfs: [],
  },
  dict: null,
  webdict: null,
  tSpeakUrl: '',
  speakUrl: '',
  translation: [],
  web: [],
  isWord: false
}
// 实际搜索结果
const result:Ref<SearchResult> = ref(constResult)


// 默认单词是没有star的
const isStar:Ref<boolean> = ref(false)
// 用于搜索的超时任务
let timeoutEvent: NodeJS.Timeout;
// 搜索开始
async function searchStart() {
  if (timeoutEvent != undefined)
    clearTimeout(timeoutEvent)
  await searchReq(searchWord.value).then(value => {
    if (value.data.isWord == true)  { // 排除不是单词的情况
      isStar.value = !!prop.wordList?.includes(searchWord.value);
      result.value = value.data;
    } else {
      result.value = constResult
    }
  }).catch(reason => {
  }).finally(
    () => loading.value = false
  )
}

// 延时开始搜索
function trySearch(value:string) {
  showResult.value = value != '';
  isStar.value = false
  loading.value = true;
  if (timeoutEvent != undefined)
    clearTimeout(timeoutEvent)
  timeoutEvent = setTimeout(searchStart, 3000);
}

// 播放发音
const au:HTMLAudioElement = new Audio()
const playVideo = (url:string) => {
  au.src = url;
  au.play()
}

// 是否在搜索状态下
const isSearch:Ref<boolean> = ref(false)

// 修改收藏状态
function starChange(flag:boolean):void {
  const defaultModel = mongooseDefaultStore()
  const collectionModel = mongooseCollectionStore()
  if (flag) {
    let item:Word = {
      word: searchWord.value,
      means: result.value.basic.explains,
      sound: result.value.basic.phonetic,
      soundUrl: result.value.basic["us-speech"],
      show: false,
    }
    collectionModel.defaultModel.model.create(item)
    prop.collectionList.push(item)
  }
  else {
    let item:Word = {
      word: searchWord.value,
      means: result.value.basic.explains,
      sound: result.value.basic.phonetic,
      soundUrl: result.value.basic["us-speech"],
      show: false,
    }
    let i = prop.collectionList?.indexOf(item)
    if (i != undefined)
      prop.collectionList?.splice(i, 1)
    collectionModel.defaultModel.model.deleteOne({word: searchWord.value}, (error)=> {
      console.log(error);
    })
  }
}

defineExpose({
  playVideo
})

</script>

<style scoped>

:deep(.el-input__wrapper) {
  /*background: rgba(255, 255, 255, 0); !*覆盖原背景颜色，设置成透明 *!*/
  background-color: transparent;
  border-radius: 95px;
  border: 0;
  box-shadow: 0 0 0 1px;
}

:deep(.el-descriptions__body) {
  background-color: transparent;
  --el-text-color-primary: rgba(255, 255, 255, 0.8);
  --el-descriptions-item-bordered-label-background: #00000000;
  --el-descriptions-table-border: 0;
}


:deep(.el-descriptions__title) {
  --el-text-color-primary: rgba(255, 255, 255, 0.8);
}

.search-box {
  width: 100%;
  height: inherit;
  margin-left: 18%;
  margin-right: 10%;
}

</style>