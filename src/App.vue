<script setup lang="ts">
import { RouterView } from "vue-router";
import { configCounterStore } from "@/stores/counter";
import { ipcRenderer } from "electron";
import type { Config } from "@/interface/typings";
import router from "@/router";
import { ElMessage } from "element-plus";
import { provide, ref, watch } from "vue";
import { mongooseCollectionStore, mongooseDefaultStore, tempMongooseStore } from "@/stores/mongoose";

const mongoose = require("mongoose");
const { Schema } = mongoose;

// 连接mongoDB，使用mongoose
const startMongo = (dbName: string, collectionName: string) => {
  const url: string =
    "mongodb+srv://cherish:Yuchenyu1@cluster0.pa95kl8.mongodb.net/?retryWrites=true&w=majority";
  let con = mongoose.createConnection(url, { dbName: dbName });
  let types = {
    word: {
      type: String,
      unique: true
    },
    means: [String],
    sound: String,
    soundUrl: String
  };
  const schema = new Schema(types, { collection: collectionName });
  return con.model(collectionName, schema);
};

const configStore = configCounterStore();
// const configStore = configCounterStore();
// 读取配置到pinia中
const ready = ref(false);
ipcRenderer
  .invoke("config-get")
  .then((config: Config) => {
    console.log(config);
    if (config.user == undefined) {
      configStore.setConfig(config);
      ipcRenderer.send("config-show");
      ElMessage({
        showClose: true,
        message: "你需要进行初始配置才能进入应用"
      });
      router.push("/config").then((value) => {
        console.log(value);
      })
        .catch(reason => {
          console.log(reason);
        });
    } else {
      configStore.setConfig(config);
      router.push("/");
    }
  })
  .finally(() => (ready.value = true));

// Model初始化
const defaultModelStore = mongooseDefaultStore();
const collectionModelStore = mongooseCollectionStore();
const tempMongooseStore1 = tempMongooseStore();

function modelInit() {
  let name = configStore.config.user?.at(0)?.name;
  tempMongooseStore1.mongoose.mongoose = mongoose;
  const collectionModel = startMongo(name as string, "collection");
  const defaultModel = startMongo(
    configStore.config.repository.name,
    configStore.config.repository.classes[0]
  );
  // 共享状态
  collectionModelStore.setModel(collectionModel);
  defaultModelStore.setModel(defaultModel);
}
provide("mongoose", mongoose);

// 监视ready状态
watch(ready, (value, oldValue, onCleanup) => {
  if (value) modelInit();
});
</script>

<template>
  <router-view />
</template>

<style scoped>
.transparent-div {
  background: #00000000;
}
</style>
