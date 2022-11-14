<template>
  <div class="top-center-container">
    <div class="top">
      <el-page-header :icon="''" :title="' '">
        <template #extra>
          <div class="flex items-center">
            <el-button style="--button-height: 40px;--button-width: 50px;" @click="viewBefore"><el-icon><View/></el-icon></el-button>
            <el-button @click="closeWindow"><el-icon><Close/></el-icon></el-button>
          </div>
        </template>
      </el-page-header>
    </div>
    <div class="flex-center">
      <div class="left_1">
        <el-scrollbar>
          <el-tree :data="tree.nodes" :render-after-expand="true" :show-checkbox="false"
                   style="--el-font-size-base: 20px;" draggable :allow-drop="judgeDrop"
                   :check-strictly="false" @node-drag-start="dragStartTree" :allow-drag="judgeDrag"
                   @node-drop="dropOnTree" ref="treeRef" @node-drag-end="dragEndTree" node-key="id">
            <template #default="{node, data}">
              <el-checkbox v-if="!node.isLeaf" v-model="node.checked" style="--el-checkbox-font-size: 18px;"
                           @change="checkChange(node)">
                <div v-if="data.label === 'collection'">收藏</div>
                <div v-else-if="data.label === 'kaoyan'">考研</div>
                <div v-else-if="data.label === 'repo'">仓库</div>
                <div v-else>{{data.label}}</div>
              </el-checkbox>
              <div v-else>{{ data.label }}</div>
            </template>
          </el-tree>
        </el-scrollbar>
      </div>
      <div class="center">
        <div :class="data.length === 0 ? 'max-center-touched' : 'max-center'">
          <vue3d-loader :width="500"
                        :height="500"
                        :showFps="true"
                        :cameraPosition="{ x: 16, y: 0, z: 0 }"
                        :controlsOptions="{
                          enablePan: true,
                          enableZoom: true,
                          enableRotate: true,
                        }"
                        @load="onLoad()"
                        :rotation="rotation"
                        :backgroundColor="'#000'"
                        :backgroundAlpha="0"
                        :filePath="'src/assets/cinnamoroll.glb'"
          />
        </div>
        <div style="flex-grow: 8;height: 80%; width: 100%;">
          <el-scrollbar>
            <el-row v-for="i in rowCount" :gutter="8" style="width: 100%;margin-bottom: 3px;">
              <el-col v-for="j in (page.length - i * 3) < 0 ? page.length % 3 : 3" :span="8">
                <el-card v-for="i in [page.at((i - 1) * 3 + j - 1)]" draggable="true"
                         @dragstart="dragStartCard(i, $event)">
                  <template #header>
                    <div style="display: flex;flex-direction: column;justify-content: space-around;align-items: center;">
                      <el-tag style="--el-tag-font-size: 18px; width: 60%;">{{ i.word }}</el-tag>
                      <el-button link style="--el-button-text-color: var(--el-color-primary)" @click="playSound(i.soundUrl)">[{{ i.sound }}]
                      </el-button>
                    </div>
                  </template>
                  <template #default>
                    <ShowMeansPop :explains="i.means" :ellipsis="true" />
                  </template>
                </el-card>
              </el-col>
            </el-row>
          </el-scrollbar>
        </div>
        <div style="flex-grow: 1;">
          <el-pagination :total="pageCount" @current-change="pageIndexChange"
                         layout="prev, pager, next, total" :page-count="pageCount"></el-pagination>
        </div>
      </div>
      <div class="right">
        <div class="zoom-img">
          <img src="src/assets/6890de031dab482b9b3341d1d135a54f.jpg" alt="" class="circle-pic" />
        </div>
        <el-header class="title-tip">
          显示单词
        </el-header>
        <el-scrollbar @dragover.prevent="dragOverCollectionList" @drop="dropCollectionList">
          <div v-for="(i, index) in toLearnWrapper" class="to-learn-list">
            <li class="to-learn-list-item" draggable="true">
              {{ i.word }}
              <div class="to-learn-item-buttons">
                <el-button :icon="Delete" class="to-learn-item-button" size="small" @click="deleteToLearn(i)" round/>
                <label for="my_box" :class="i.stared ? 'my-check-box-wrapper-checked' :
                'my-check-box-wrapper'" @click.prevent="checkRadioChecked(i)">
                  <input type="radio" class="my-check-box" id="my_box">
                  <span class="my-check-box-inner">
                    <el-icon :size="14"><Star /></el-icon>
                  </span>
                </label>
              </div>
            </li>
          </div>
        </el-scrollbar>
      </div>
    </div>
  </div>
  <div class="center-popup" v-show="isDragging" @dragover.prevent="" @drop="dropOnDelete">
    <el-icon style="width: 100%;height: 100%;"><Delete /></el-icon>
  </div>
  <img src="src/assets/cinnamoroll-36.gif" class="left-bottom-img" alt="" width="150">
  <img src="src/assets/tumblr-lp8lzame1s1qapbyt540.gif" class="right-bottom-img" alt="" width="150">
</template>

<script setup lang="ts">
import { ipcRenderer } from "electron";
import { configCounterStore } from "@/stores/counter";
import type { TreeNode, TreeRoot, Word } from "@/interface/typings";
import type { Ref } from "vue";
import { computed, onMounted, ref, watch } from "vue";
import { wordsStore } from "@/stores/words";
import { Close, Delete, Star, View } from "@element-plus/icons-vue";
import type Node from "element-plus/es/components/tree/src/model/node";
import ShowMeansPop from "@/components/ShowMeansPop.vue";
import { storeToRefs } from "pinia";
import { mongooseCollectionStore, mongooseDefaultStore, tempMongooseStore } from "@/stores/mongoose";
import router from "@/router";
import { ElMessage, ElTree } from "element-plus";
import { vue3dLoader } from "vue-3d-loader";
const bodyEle = document.getElementById("first_body")
if (bodyEle)
bodyEle.style.backgroundColor = "#fff"
const appDiv = document.getElementById("app")
if (appDiv) {
  appDiv.style.padding = '0'
}
const treeRef = ref<InstanceType<typeof ElTree> | null>(null)
const configs = configCounterStore()
const words = wordsStore();
const tree = computed(() => {
  let id = 1;
  let users = configs.config.user;
  let word = words.collectionList;
  let repo = configs.config.repository;
  let allWord: any = words;
  let t = {nodes: []} as TreeRoot
  // 用户的单词库
  if (users != undefined) {
    for (let i = 0; i < users?.length; ++i) {
      let node = {label : '', children: [], id: id++} as TreeNode
      let u = users?.at(i)
      if (u?.name != undefined)
        node.label = u.name;
        u?.classes.forEach(value => {
          let userNode = {
            label: value,
            repo: u?.name,
            class: value,
            leaf: false,
            id: id++,
            children: [] as TreeNode[]
          }
          let list:Word[] = words.getWordList(value)
          list.forEach(w=> {userNode.children.push({
            label: w.word,
            repo: u?.name,
            class: value,
            leaf: true,
            id: id++
          })})
          node.children?.push(userNode)
        })
      t.nodes.push(node)
    }
  }
  // 收藏的单词
  let node = {label: "collection", children: [], class: "collection", id: id++} as TreeNode
  word.forEach(w => {node.children?.push({label: w.word, leaf: true, class: "collection", id: id++})})
  t.nodes.push(node)

  // 仓库的单词
  let node1 = {label: repo.name, children: [], repo: repo.name, id: id++} as TreeNode
  repo.classes.forEach(value => {
    let words1 = words.getWordList(value);
    let wordList = [] as TreeNode[]
    words1?.forEach(value1 => {wordList.push({label: value1.word, repo: repo.name, class: value, leaf: true, id: id++})})
    node1.children?.push({label: value, children: wordList, repo: repo.name, class: value, id: id++})
  })
  t.nodes.push(node1)
  return t;
})
const deleted:Ref<boolean> = ref(false)
const data:Ref<Word[]> = ref([])
const isDragging:Ref<boolean> = ref(false)
const pageIndex = ref(0)
const pageCount = computed(args => {
  return parseInt((data.value.length / 24).toString()) + 1;
})
const page:Ref<Word[]> = computed(() => {
  let len = data.value.length;
  if (len > 0) {
    let startIndex = pageIndex.value * 24;
    let endIndex = startIndex + 23 >= len ? len : startIndex + 24;
    return data.value.slice(pageIndex.value * 24, endIndex);
  }
  return [];
})
function checkChange(node:Node) {
  if (node.checked) {
    if (node.level == 1 && node.label != 'collection') {
      node.childNodes.forEach(value => {if (!value.checked) {
        value.checked = true;
        checkChange(value);
      }})
    } else if (node.label == 'collection') {
      words.collectionList.forEach(w => {
        data.value.push(w);
      });
    } else {
      let l = words.getWordList(node.data.class);
      if (l) {
        l.forEach(w => {
          data.value.push(w);
        });
      }
    }
  } else {
    if (node.level == 1 && node.data.label != 'collection') {
      node.childNodes.forEach(value => {value.checked = false;checkChange(value)})
    } else if (node.label === 'collection') {
      let start = words.collectionList.at(0)
      let end = words.collectionList.at(words.collectionList.length - 1)
      if (start && end) {
        let s = data.value.indexOf(start)
        let e = data.value.indexOf(end)
        data.value.splice(s, e - s + 1)
      }
    } else {
        let l = words.getWordList(node.data.class);
        if (l) {
          let start = l.at(0);
          let end = l.at(l.length - 1);
          if (start && end) {
            let s = data.value.findIndex(w => {return w.word == start?.word})
            let e = data.value.findIndex(w => {return w.word == end?.word})
            data.value.splice(s, e-s+1)
          }
        }
      }
    }
}
function closeWindow() {
    ipcRenderer.send("close-window")
}
const rowCount = computed(() => {
  let b = parseInt((page.value.length / 3).toString()) + 1;
  return b;
})
const au:HTMLAudioElement = new Audio()
function playSound(url:string) {
    au.src = url;
    au.play()
}
function pageIndexChange(i) {
  pageIndex.value = i-1;
}
const { toLearnWord, collectionList } = storeToRefs(words)
function deleteToLearn(word) {
  let indexOf = toLearnWord.value.findIndex(w => {return w.word == word.word});
  toLearnWord.value.splice(indexOf, 1)
}
const collectionStringList = computed(() => {
  let i:string[] = [];
  collectionList.value.forEach(w => {
    i.push(w.word)
  })
  return i;
})
const toLearnWrapper = computed(() => {
  let i = [] as any
  toLearnWord.value.forEach(w => {
    let assign = Object.assign({stared: collectionStringList.value.indexOf(w.word) != -1}, w);
    i.push(assign)
  })
  return i;
})
const store = mongooseCollectionStore()
const repoStore = mongooseDefaultStore()
const tempStore = tempMongooseStore()
function checkRadioChecked(i) {
  if (i.stared) {
    let index = collectionList.value.findIndex(w => {return w.word == i.word})
    collectionList.value.splice(index, 1);
    store.defaultModel.model.deleteOne({word: i.word}, (error)=> {
      console.log(error);
    })
  } else {
    let tempI = i;
    delete tempI.stared
    collectionList.value.push(tempI)
    store.defaultModel.model.create(tempI)
  }
}
function judgeDrop(draggingNode, dropNode, type) {
  if (type != 'inner') return false;
  if (dropNode.data.label == 'collection')
    if (type == 'inner') {
        return collectionList.value.findIndex(w => {
          return w.word == draggingNode.data.label
        }) == -1;
    }
  if (dropNode.level == 2 && dropNode.data.class != 'collection') {
    let w = words.getWordList(dropNode.data.class)
    if (w) {
      return w.findIndex(w => {return w.word == draggingNode.data.label;}) == -1
    } else {
      return true;
    }
  }
  return false;
}
function judgeDrag(node) {
  if(!node.data.children) {
    dragNodeParent.value = node.parent;
    return true;
  } else
    return false;
}
const dragNodeParent = ref(null)
function dragStartTree(node, event) {
  isDragging.value = true;
  let dragData = {
    word: node.data.label,
    class: node.data.class,
    repo: node.data.repo
  }
  event.dataTransfer.setData("data", JSON.stringify(dragData))
}
function dragOverCollectionList(event) {}
function dropCollectionList(event) {
  event.preventDefault();
  let data = JSON.parse(event.dataTransfer.getData("data"));
  if (data.class == 'collection') {
    let index = toLearnWord.value.findIndex(w => {return w.word == data.word})
    if (index == -1) {
      let newAddWord = collectionList.value.find(w => {return w.word == data.word})
      if (newAddWord)
        toLearnWord.value.push(newAddWord)
    }
  }
  else if (data.repo == 'repo') {
    let list = words.getWordList(data.class);
    let index = toLearnWord.value.findIndex(w => {return w.word == data.word})
    if (index == -1) {
      let newAddWord = list.find(w => {return w.word == data.word})
      if (newAddWord)
        toLearnWord.value.push(newAddWord)
    }
  } else if (data.sound != null) {
    let result = toLearnWord.value.findIndex(w => {return w.word == data.word})
    if (result == -1) {
      toLearnWord.value.push(data)
    }
  }
}
function dragStartCard(word, event) {
  event.dataTransfer.setData("data", JSON.stringify(word))
}
function viewBefore() {
  ipcRenderer.send("main-show")
  router.push("/")
}
function dropOnTree(before, after, inner, event) {
  console.log(before);
  let moveNode:TreeNode = before.data
  let dropNode:TreeNode = after.data
  // 找到要移动的单词
  let w: Word | undefined;
  if (moveNode.class == 'collection') {
    w = collectionList.value.find(w => {return w.word == moveNode.label})
  } else if (moveNode.repo == 'repo') {
    if (moveNode.class) {
      let listElement:Word[] = words.getWordList(moveNode.class)
      w = listElement.find(w => {return w.word == moveNode.label})
    }
  } else {
    if (moveNode.class) {
      let listElement:Word[] = words.wordsList[moveNode.class];
      w = listElement.find(w => {return w.word == moveNode.label})
    }
  }
  // 移动
  if (w == undefined)
    return;
  if (dropNode.label == 'collection') {
      if (collectionList.value.findIndex(i => {return i.word == w?.word}) == -1) {
        collectionList.value.push(w);
        store.defaultModel.model.create(w);
    }
  } else if (dropNode.repo == 'repo') {
      if (dropNode.class) {
        let listElement1:Word[] = words.getWordList(dropNode.class)
        if (listElement1.findIndex(i => {return i.word == w?.word}) == -1) {
          listElement1.push(w);
          words.setWoldList(dropNode.class, listElement1)
          repoStore.defaultModel.model.create(w);
        }
    }
  } else {
      if (dropNode.repo && dropNode.class) {
        let list:Word[] = words.getWordList(dropNode.class)
        if (list.findIndex(i => {return i.word == w?.word}) == -1) {
          list.push(w);
          words.setWoldList(dropNode.class, list);
          tempStore.init(dropNode.repo, dropNode.class);
          tempStore.mongoose.model.create(w);
        }
      }
  }
  // 节点情况不变
  if (dragNodeParent.value)
    treeRef.value?.append(before.data, dragNodeParent.value)
}
function dragEndTree(before, after, inner, event) {
  isDragging.value = false;
  if (deleted.value) {
    treeRef.value?.remove(before)
    deleted.value = false;
  }
}
function dropOnDelete(event) {
  let data1 = JSON.parse(event.dataTransfer.getData("data"));
  if (data1.class == 'collection') {
    console.log(1);
    if (data1?.word) {
      let index = collectionList.value.findIndex(w => {
        return w.word == data1.word;
      });
      console.log(index);
      if (index != -1) {
        collectionList.value.splice(index, 1);
        store.defaultModel.model.deleteOne({ word: data1.word }, (error) => {
          console.log(error);
        });
        deleted.value = true;
      }
    }
  } else if (data1.repo != 'repo') {
    if (data1.class) {
      let list = words.getWordList(data1.class)
      let index = list?.findIndex(w => {return w.word == data1.word})
      if (index != -1) {
        list.splice(index, 1);
        words.setWoldList(data1.class, list);
        tempStore.init(data1.repo, data1.class)
        tempStore.mongoose.model.deleteOne({word: data1.word}, (error) => {
          console.log(error);
        });
        deleted.value = true;
      }
    }
  } else if (data1.repo == 'repo') {
    ElMessage.error("该项目不能删除！")
  }
}
function downloadData() {
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
        words.setWoldList(name, newDocs)
        toLearnWord.value = words.wordsList[name].slice(0, 9)
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
      words.setCollectionList(realWord)
    }
  })
  configs.config.user?.forEach(conf => {
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
          words.setWoldList(clz, realWord)
        }
      })
    })
  })
}
watch(tree, (value, oldValue, onCleanup) => {
  data.value = []
})
const rotation = ref()
rotation.value = {
  x: 0,
  y: 0,
  z: 0,
};
function onLoad() {
  rotate();
}
function rotate() {
  requestAnimationFrame(rotate);
  rotation.value.y -= 0.01;
}
</script>

<style scoped>

#dbg {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
}

:root {
  --good-pink: #f3d5d5;
}

.left-bottom-img {
  position: absolute;
  bottom: 20px;
  pointer-events: none;
  opacity: 60%;
}

.max-center-touched {
  float: left;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  position: absolute;
}



.right-bottom-img {
  position: absolute;
  bottom: 20px;
  right: 10px;
  pointer-events: none;
  opacity: 60%;
}

.circle-pic {
  width: 80%;
  height: 80%;
  margin: 20px;
  /*left: 480px;*/
  /*top: -20px;*/
  z-index: 9;
  border-radius: 150px;
  object-fit: cover;
}

.zoom-img {
  height: 50%;
  width: 80%;
  background-color: #f3d5d5;
  margin: 20px;
  z-index: 9;
  border-radius: 30px;
}

.zoom-img img {
  transition: transform 1s;
}

.zoom-img img:hover {
  transform: scale(105%);
  filter: saturate(120%);
  transition-duration: 1s;
  animation-timing-function: ease-in-out;
}

.zoom-img img:hover {
-webkit-transition: all 1s ease-out;
-moz-transition: all 1s ease-out;
-o-transition: all 1s ease-out;
-ms-transition: all 1s ease-out;
transition: all 1s ease-out;
}

.center-popup {
  float: top;
  width: 25%;
  height: 25%;
  margin: 200px 200px 200px 40%;
  background-color: #e9e9eb;
}

.title-tip {
  display: flex;
  align-items: center;
  margin: 10px 40px 10px 0;
  color: #c6e2ff;
  background-color: var(--el-color-primary);
  font-family: 等线,serif;
  font-size: 20px;
  height: 35px;
  border-radius: 2px 10px 10px 2px;
}

.to-learn-list {
  list-style: none;
  display: flex;
  flex-direction: column;
}

.to-learn-list-item {
  height: 50px;
  background: var(--el-color-primary-light-9);
  margin-bottom: 10px;
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  padding-left: 16px;
}

.to-learn-item-button {
  background-color: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-info-light-8);
  --button-width: 30px;
  --button-height: 30px;
}

.my-check-box-wrapper {
  width: 30px;
  height: 30px;
  justify-content: center;
  align-items: center;
  display: flex;
  border-radius: 20px;
  border: 1px solid #e9e9eb;
}

.my-check-box-wrapper-checked {
  width: 30px;
  height: 30px;
  justify-content: center;
  align-items: center;
  display: flex;
  background-color: var(--el-color-primary);
  border-radius: 20px;
  border: 1px solid #e9e9eb;
  --el-button-text-color: var(--el-color-white)
}

.my-check-box-wrapper-checked .my-check-box-inner:hover {
  color: #ffffff;
}


.my-check-box-inner {
  color: var(--el-button-text-color,var(--el-text-color-regular))
}

.my-check-box-inner:hover {
  color: var(--el-color-primary);
}

.my-check-box {
  opacity: 0;
  outline: 0;
  position: absolute;
  margin: 0;
  z-index: -1;
}

.to-learn-item-buttons {
  display: flex;
  position: absolute;
  right: 10px;
}

.el-row {
  margin-bottom: 8px;
}

.top-center-container {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
}

:global(#app) {
  position: fixed;
  width: 100%;
  height: 100%;
  padding: 0;
}

.flex-center {
  display: flex;
  width: 100%;
  height: 100%;
}

.top {
  width: 96%;
  margin: auto;
}

.top::after{
  content: '';
  width: 100%;
  height: 1px;
  display: block;
  margin: 0 auto;
  border-bottom: var(--el-border);
}

.left_1 {
  /*flex-grow: 20;*/
  width: 18%;
  padding: 15px;
  height: 90%;
}

.left_1::before {
  position: absolute;
  right: 0;
  content: '';
  margin: 0 auto;
  height: 98%;
  width: 1px;
  display: block;
  border-right: var(--el-border);
}

.center {
  /*flex-grow: 63;*/
  padding: 15px;
  height: 95%;
  width: 60%;
  display: flex;
  flex-direction: column;
  background-image: url("@/assets/471672_5777e.gif"), url("@/assets/hJmfqZW.jpg");
  /*background-size: 100% 100%, 100% 100%;*/
  background-position: right bottom, left top;
  background-repeat: no-repeat, repeat;
  animation: iloaded 2s forwards;
}

.max-center {
  float: left;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  /*z-index: -1;*/
  position: absolute;
}

.center::before {
  position: absolute;
  right: 0;
  content: '';
  margin: 0 auto;
  height: 93%;
  width: 1px;
  display: block;
  border-right: var(--el-border);
}

.right {
  /*float: right;*/
  width: 22%;
  /*flex-grow: 20;*/
  display: flex;
  flex-direction: column;
  padding: 15px;
  height: 100%;
}

:deep(.el-menu-item) {
  margin: 10px;
}

:root {
  --button-width: 50px;
  --button-height: 40px;
}

.el-button {
  /*--button-width: 50px;*/
  /*--button-height: 40px;*/
  width: var(--button-width);
  height: var(--button-height);
  --el-border: 0;
}

:deep(.el-divider.el-divider--vertical) {
  border: 0;
}

:deep(.el-tree-node__content) {
  height: 35px;
}

:deep(#app) {
  padding: 0;
}

</style>