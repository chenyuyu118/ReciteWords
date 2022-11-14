<script setup lang="ts">
import { inject,  ref,  computed } from "vue";
import type { Ref } from "vue";
import { Close, FullScreen, Aim, Search, Upload, Download, Delete } from "@element-plus/icons-vue";
import {ipcRenderer} from 'electron'
import SearchDialog from "@/components/SearchDialog.vue";
import type { Word } from "@/interface/typings";
import ShowMeansPop from "@/components/ShowMeansPop.vue";
import { mongooseCollectionStore, mongooseDefaultStore, tempMongooseStore } from "@/stores/mongoose";
import { wordsStore } from "@/stores/words";
import router from "@/router";
import { storeToRefs } from "pinia";
import { ElMessageBox } from "element-plus";
import { configCounterStore } from "@/stores/counter";
// 设置body背景为透明
let _body = document.getElementById("first_body");
if (_body)
  _body.style.backgroundColor = '#FFFFFF00'
const appDiv = document.getElementById("app")
if (appDiv) {
  appDiv.style.padding = '0'
}
// 搜索组件
const searchDialogRef:Ref<SearchDialog> = ref<InstanceType<typeof SearchDialog> | null>(null)
// mongoDB的model和连接用于管理
const mongoose:any = inject("mongoose")
const wordStore = wordsStore()
const {wordsList, toLearnWord, collectionList} = storeToRefs(wordStore)
const words:Ref<Word[]> = ref([])
// 收藏列表，便于搜词时查找
const wordList = computed(() => {
  let i:string[] = []
  collectionList.value.forEach(w => {i.push(w.word)})
  return i;
});
// 关闭应用
function closeWindow() {
  //  在这里添加是否要退出的确认
  ElMessageBox.confirm('确认要退出吗？', '警告', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: "warning"
  }).then(value => {
    if (value == 'confirm') {
      if (mongoose)
        mongoose.disconnect()
      ipcRenderer.send("close-window")
    }
  }).catch(reason => {
    if (reason == 'cancel')
      return;
  })
}
//  全屏
function fullScreenFuc() {
  ipcRenderer.send("panel-show")
  downloadData();
  router.push("panel")
}
// 移动窗口
function moveWindowTo(event: DragEvent) {
  ipcRenderer.send("move-window", event.offsetX, event.offsetY)
}
// 搜索窗口
const isShown:Ref<boolean> = ref(false)
function searchWordOpen():void {
  isShown.value = true
}
// 从云端拉取数据
const tempStore = tempMongooseStore()
const { config } = configCounterStore()
function downloadData() {
  // 循环的单词列表
  // 获取依赖注入的Model
  const collectionModel = mongooseCollectionStore()
  const defaultModel = mongooseDefaultStore()
  defaultModel.defaultModel.model.find({},
   null, null,
    (error, docs) => {
      if (error) console.log(error);
      else {
        let name = defaultModel.defaultModel.model.modelName;
        let newDocs:Word[] = [];
        docs.forEach(value => {newDocs.push({
          word: value.word,
          soundUrl: value.soundUrl,
          means: value.means,
          sound: value.sound
        })})
        wordStore.setWoldList(name, newDocs)
        toLearnWord.value = wordStore.wordsList[name].slice(0, 9)
      }
    })
  collectionModel.defaultModel.model.find({},null,  null, (error, docs) => {
    if (error) console.log(error);
    else {
      let temp:Word[] = docs;
      let realWord:Word[] = [];
      temp.forEach(value => {
        realWord.push({
          word: value.word,
          means: value.means,
          soundUrl: value.soundUrl,
          sound: value.sound
        })
      })
      wordStore.setCollectionList(realWord)
    }
  })

  config.user?.forEach(conf => {
    conf.classes.forEach(clz => {
      tempStore.init(conf.name, clz);
      tempStore.mongoose.model.find({}, (error, docs) => {
        if (error)
          console.log(error);
        else {
          let temp:Word[] = docs;
          let realWord:Word[] = [];
          temp.forEach(value => {
            realWord.push({
              word: value.word,
              means: value.means,
              soundUrl: value.soundUrl,
              sound: value.sound
            })
          })
          wordStore.setWoldList(clz, realWord)
        }
      })
    })
  })
}
// 取消一个单词的观看
function unWatchWord(w: Word) {
  let i:number | undefined = words.value?.indexOf(w)
  if (i != -1 && i != undefined)
    words.value?.splice(i, 1);
}
</script>

<template>
  <search-dialog v-model="isShown" :words="words" :wordList="wordList"
                 :collectionList="collectionList"  ref="searchDialogRef">
    <template #title>
    </template>
  </search-dialog>
  <div class="flex-container">
    <div class="right-top-container">
      <el-button class="icon-style" :icon="Close"
                 circle :bg="true" @click="closeWindow">
      </el-button>
    </div>
    <div class="center-container">
      <el-carousel trigger="hover" :interval="5000" type="card" height="248px">
        <el-carousel-item v-if="toLearnWord.length === 0">
          <h1 class="words-style2">
            还没有单词
          </h1>
          <h1 class="words-style2">
            快来添加吧！
          </h1>
        </el-carousel-item>
        <el-carousel-item v-for="w in toLearnWord">
          <el-button :icon="Delete" circle size="large" @click="unWatchWord(w)">
          </el-button>
          <h1 class="words-style">
            {{ w.word }}
          </h1>
          <br />
          <div style="text-align: center">
            <show-means-pop :ellipsis="false" :explains="w.means" />
          </div>
          <el-button link @click="searchDialogRef.playVideo(w.soundUrl)"
                     style="color: var(--el-color-primary)">
            [{{ w.sound }}]
          </el-button>
          <div v-show="w.show">
            <el-row v-for="mean in w.means">
              <h3 style="text-align: center;width: 100%">{{ mean }}</h3>
            </el-row>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>
    <div class="left-bottom-container">
      <el-affix :offset="8" target=".left-bottom-container">
        <el-row :gutter="7">
          <el-col :span="6">
            <el-button class="icon-style" :icon="FullScreen"
                       circle :bg="true" @click="fullScreenFuc">
            </el-button>
          </el-col>
          <el-col :span="6">
            <div draggable="true" @dragend="moveWindowTo">
              <el-button class="icon-style" :icon="Aim"
                         circle :bg="true" @click="fullScreenFuc">
              </el-button>
            </div>
          </el-col>
          <el-col :span="6">
            <el-button class="icon-style" :icon="Search" circle
                       :bg="true" @click="searchWordOpen" />
          </el-col>
          <el-col :span="6">
            <el-button class="icon-style" :icon="Download" circle
                       :bg="true" @click="downloadData" />
          </el-col>
        </el-row>
      </el-affix>
    </div>
  </div>
  <img class= "top-left-img"
       src="src/assets/cinnamoroll-35.gif">
</template>

<style scoped>

:root {
  --cartoon-bg-opacity: 30%;
}

.top-left-img {
  position: absolute;
  top: 0;
  left: 0;
}

.el-carousel {
  width: 350px;
}

.flex-container {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  flex-direction: column;
  justify-content: center;
}

.words-style {
  height: 80px;
  font-family: "JetBrains Mono ExtraBold", sans-serif;
  font-style: italic;
  font-size: 26px;
}

.words-style2 {
  height: 50px;
  font-family: "JetBrains Mono ExtraBold", sans-serif;
  font-style: italic;
  font-size: 19px;
}

.el-carousel__item {
  text-align: center;
  height: 240px;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  --cartoon-bg-opacity: 88%;
}

.el-carousel__item button:first-of-type {
  margin-left: 130px;
  margin-top: 3px;
  background-color: #00000000;
  border: 0;
}

.el-carousel__item h1 {
  color: #3e444b;
  opacity: 1;
  line-height: 90px;
  margin: 0;
  text-align: center;
}

.el-carousel__item:nth-child(2n) {
  background: #99a9bf;
}

.el-carousel__item:nth-child(2n + 1) {
  background: #d3dce6;
}



/*.el-carousel__item:nth-child(3n)::after {*/
/*  position: absolute;*/
/*  top: 0;*/
/*  bottom: 0;*/
/*  left: 0;*/
/*  right: 0;*/
/*  opacity: var(--cartoon-bg-opacity);*/
/*  background-image: url("@/assets/CINNAMOROLL.jpg");*/
/*  background-size: 100% 100%;*/
/*  background-repeat: no-repeat;*/
/*  background-position: center;*/
/*  z-index: -1;*/
/*  content: ' ';*/
/*}*/

/*.el-carousel__item:nth-child(3n+1)::after {*/
/*  position: absolute;*/
/*  top: 0;*/
/*  bottom: 0;*/
/*  left: 0;*/
/*  right: 0;*/
/*  opacity: var(--cartoon-bg-opacity);*/
/*  background-image: url("@/assets/kuromi.jpg");*/
/*  background-size: 100% 100%;*/
/*  background-repeat: no-repeat;*/
/*  background-position: center;*/
/*  z-index: -1;*/
/*  content: ' ';*/
/*}*/

/*.el-carousel__item:nth-child(3n+2) {*/
/*  background-image: url("@/assets/POMPOMPURIN.jpg");*/
/*  background-size: 100% 100%;*/
/*  background-repeat: no-repeat;*/
/*  background-position: center;*/
/*  z-index: -1;*/
/*  content: ' ';*/
/*  position: absolute;*/
/*  top: 0;*/
/*  bottom: 0;*/
/*  left: 0;*/
/*  right: 0;*/
/*  opacity: var(--cartoon-bg-opacity);*/
/*}*/


.right-top-container {
  text-align: center;
  height: 9%;
  width: 100%;
  right: 10px;
  /*color: rgba(241, 237, 237, 0.38);*/
}

/*.right-top-container::after {*/
/*  content: '';*/
/*  display: block;*/
/*  width: 1px;*/
/*  background-color: black;*/
/*  height: 100px;*/
/*  margin: auto;*/
/*}*/

.center-container {
  margin-top: 3px;
  width: 100%;
  height: 84%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.left-bottom-container {
  text-align: center;
  position: absolute;
  left: 0;
  bottom: 0;
}

.icon-style {
  background: #00000030;
  color: white;
}

.icon-style:focus {
  background: #00000000;
  color: inherit;
}

:global(#app) {
  position: fixed;
  width: 100%;
  height: 100%;
  padding: 1rem;
}

</style>
