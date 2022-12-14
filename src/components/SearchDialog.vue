<template>
  <el-dialog
    :show-close="false"
    destroy-on-close
    draggable
    style="
      --el-dialog-bg-color: rgba(0, 0, 0, 0.6);
      width: 80%;
      height: 70%;
      --el-header-height: 1px;
      --el-dialog-padding-primary: 0px;
    "
    @open="focusOn"
    @keydown.enter.prevent="searchStart"
  >
    <template #header>
      <div style="height: 1px">
        <slot name="title"></slot>
      </div>
    </template>
    <div class="search-box">
      <el-form :inline="true">
        <el-form-item label-width="0">
          <el-col :span="24">
            <el-input
              ref="searchInput"
              v-model="searchWord"
              :clearable="true"
              :suffix-icon="Search"
              @input="trySearch"
            >
            </el-input>
          </el-col>
        </el-form-item>
      </el-form>
    </div>
    <el-descriptions
      v-show="showResult"
      v-loading="loading"
      :column="1"
      border
      element-loading-background="transparent"
      style="margin-left: 20px; margin-right: 20px"
    >
      <template #title>
        {{ searchWord }}
        <el-switch
          v-model="isStar"
          :active-icon="Star"
          inline-prompt
          @change="starChange"
        >
        </el-switch>
      </template>
      <el-descriptions-item label="ιδΉ">
        <div>
          <show-means-pop :ellipsis="true" :explains="result.basic.explains" />
        </div>
      </el-descriptions-item>
      <el-descriptions-item label="ει³">
        <el-button
          v-show="result.basic['uk-speech'] !== ''"
          link
          @click="playVideo(result.basic['uk-speech'])"
        >[{{ result.basic.phonetic }}]
        </el-button
        >
      </el-descriptions-item>
    </el-descriptions>
  </el-dialog>
</template>

<script setup lang="ts">
import type { Ref } from "vue";
import { nextTick, ref } from "vue";
import { Search, Star } from "@element-plus/icons-vue";
import { searchReq } from "@/api/axios";
import type { SearchResult, Word } from "@/interface/typings";
import ShowMeansPop from "@/components/ShowMeansPop.vue";
import { ElInput } from "element-plus";
import { mongooseCollectionStore } from "@/stores/mongoose";

const searchWord: Ref<string> = ref("");
const showResult: Ref<boolean> = ref(false);
const loading: Ref<boolean> = ref(true);

//  θ·εΎδΌ ιηεθ―δΏ‘ζ―
const prop = defineProps<{
  words?: Word[];
  wordList?: string[];
  collectionList?: any;
}>();

// θη¦ζη΄’ζ‘
const searchInput = ref<InstanceType<typeof ElInput> | null>(null);
function focusOn() {
  nextTick(() => {
    searchInput.value?.focus();
  }); // nextTickεΏθ¦η
}

// ι»θ?€ζη΄’η»ζοΌη¨δΊιη½?ζη΄’οΌ
const constResult: SearchResult = {
  basic: {
    exam_type: [],
    explains: [],
    phonetic: "",
    "uk-phonetic": "",
    "uk-speech": "",
    "us-phonetic": "",
    "us-speech": "",
    wfs: []
  },
  dict: null,
  webdict: null,
  tSpeakUrl: "",
  speakUrl: "",
  translation: [],
  web: [],
  isWord: false
};
// ε?ιζη΄’η»ζ
const result: Ref<SearchResult> = ref(constResult);

// ι»θ?€εθ―ζ―ζ²‘ζstarη
const isStar: Ref<boolean> = ref(false);
// η¨δΊζη΄’ηθΆζΆδ»»ε‘
let timeoutEvent;
// ζη΄’εΌε§
async function searchStart() {
  if (timeoutEvent != undefined) clearTimeout(timeoutEvent);
  await searchReq(searchWord.value)
    .then((value) => {
      if (value.data.isWord == true) {
        // ζι€δΈζ―εθ―ηζε΅
        isStar.value = !!prop.wordList?.includes(searchWord.value);
        result.value = value.data;
      } else {
        result.value = constResult;
      }
    })
    .catch((reason) => {
    })
    .finally(() => (loading.value = false));
}

// ε»ΆζΆεΌε§ζη΄’
function trySearch(value: string) {
  showResult.value = value != "";
  isStar.value = false;
  loading.value = true;
  if (timeoutEvent != undefined) clearTimeout(timeoutEvent);
  timeoutEvent = setTimeout(searchStart, 3000);
}

// ζ­ζΎει³
const au: HTMLAudioElement = new Audio();
const playVideo = (url: string) => {
  au.src = url;
  au.play();
};

// δΏ?ζΉζΆθηΆζ
function starChange(flag: boolean): void {
  const collectionModel = mongooseCollectionStore();
  if (flag) {
    let item: Word = {
      word: searchWord.value,
      means: result.value.basic.explains,
      sound: result.value.basic.phonetic,
      soundUrl: result.value.basic["us-speech"],
      show: false
    };
    collectionModel.defaultModel.model.create(item);
    prop.collectionList.push(item);
  } else {
    let item: Word = {
      word: searchWord.value,
      means: result.value.basic.explains,
      sound: result.value.basic.phonetic,
      soundUrl: result.value.basic["us-speech"],
      show: false
    };
    let i = prop.collectionList?.indexOf(item);
    if (i != undefined) prop.collectionList?.splice(i, 1);
    collectionModel.defaultModel.model.deleteOne(
      { word: searchWord.value },
      (error) => {
        console.log(error);
      }
    );
  }
}

defineExpose({
  playVideo
});
</script>

<style scoped>
:deep(.el-input__wrapper) {
  /*background: rgba(255, 255, 255, 0); !*θ¦ηεθζ―ι’θ²οΌθ?Ύη½?ζιζ *!*/
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
