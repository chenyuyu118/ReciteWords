import type { Ref } from "vue";
import { ref } from "vue";
import { defineStore } from "pinia";
import type { Config } from "@/interface/typings";

export const configCounterStore = defineStore(
  "config",
  () => {
    const config: Ref<Config> = ref({
      repository: {
        name: "",
        classes: [""],
        counter: 0
      },
      user: []
    });

    function setConfig(conf: Config) {
      config.value = conf;
    }

    return { config, setConfig };
  },
  {
    persist: {
      enabled: true,
      strategies: [
        {
          key: "hhh",
          storage: localStorage
        }
      ]
    }
  }
);
