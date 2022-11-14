import { ref, computed } from "vue";
import type {Ref} from 'vue';
import { defineStore } from 'pinia'
import type { Config, UserConfig } from "@/interface/typings";
import mongoose, { model, Schema } from "mongoose";

export const mongooseDefaultStore = defineStore("mongoose", () => {
  const defaultModel = {
    model: '' as any
  }

  function setModel(model:any) {
    defaultModel.model = model;
  }
  return {defaultModel, setModel}
})

export const mongooseCollectionStore = defineStore("mongoose2", () => {
  const defaultModel = {
    model : '' as any
  }

  function setModel(model:any) {
    defaultModel.model = model;
  }

  return {defaultModel, setModel}
})

export const tempMongooseStore = defineStore("mongooseTemp", ()=> {
  const mongoose = {
    mongoose : '' as any,
    model : '' as any,
    conn: '' as any,
    currentDB: '' as string,
    currentCollection: '' as string,
    types : {
      word: {
        type: String,
        unique: true
      },
      means: [String],
      sound: String,
      soundUrl: String
    },
    schema : '' as any,
  }

  function init(dbName: string, collectionName) {
    let url: string = "mongodb+srv://cherish:Yuchenyu1@cluster0.pa95kl8.mongodb.net/?retryWrites=true&w=majority";
    if (mongoose.conn == '') {
      mongoose.conn = mongoose.mongoose.createConnection(url, { dbName: dbName });
    } else if (dbName == mongoose.currentDB && collectionName == mongoose.currentCollection) {
      return;
    } else if (dbName != mongoose.currentDB) {
      mongoose.conn = mongoose.mongoose.createConnection(url, {dbName: dbName})
    }
    mongoose.schema = new Schema(mongoose.types, { collection: collectionName });
    mongoose.model = mongoose.conn.model(collectionName, mongoose.schema);
  }

  return {mongoose, init}
})