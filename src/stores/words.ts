import { defineStore } from "pinia";
import type { Word } from "@/interface/typings";
import type { Ref } from "vue";
import { ref } from "vue";

export const wordsStore = defineStore(
  "wordsStore",
  () => {
    let wordsList = {};

    const collectionList: Ref<Word[]> = ref([]);

    const toLearnWord: Ref<Word[]> = ref([]);

    function setWoldList(name: string, l: Word[]) {
      wordsList[name] = l;
      localStorage.setItem("words", JSON.stringify(wordsList));
    }

    function getWordList(name: string): Word[] {
      const item = localStorage.getItem("words");
      if (item) {
        wordsList = JSON.parse(item);
      }
      return wordsList[name];
    }

    function setCollectionList(l: Word[]) {
      collectionList.value = l;
    }

    return {
      wordsList,
      collectionList,
      setCollectionList,
      setWoldList,
      getWordList,
      toLearnWord
    };
  },
  {
    persist: {
      enabled: true,
      strategies: [{ storage: localStorage, key: "collection" }]
    }
  }
);
