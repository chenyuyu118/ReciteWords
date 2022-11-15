import { toRaw } from "vue";

export interface Word {
  word: string;
  means: string[];
  sound: string;
  soundUrl: string;
  show?: boolean;
}

export interface SearchResult {
  basic: Basic;
  dict: any;
  webdict: any;
  tSpeakUrl: string;
  speakUrl: string;
  translation: Array<string>;
  web: Array<any>;
  isWord: boolean;
}

export interface Basic {
  exam_type: Array<string>;
  explains: Array<string>;
  phonetic: string;
  "uk-phonetic": string;
  "uk-speech": string;
  "us-phonetic": string;
  "us-speech": string;
  wfs: Array<any>;
}

export interface UserConfig {
  name: string;
  password: string;
  classes: string[];
  counter: number;
}

export interface Config {
  user?: UserConfig[];
  repository: {
    name: string;
    classes: string[];
    counter: number;
  };
}

export interface TreeNode {
  id: number;
  label: string;
  leaf?: boolean;
  repo?: string;
  class?: string;
  disabled?: boolean;
  children?: TreeNode[];
}

export interface TreeRoot {
  nodes: TreeNode[];
}

export class WordMap {
  internalMap: {};

  constructor() {
    this.internalMap = {};
  }

  set(name: string, l: Word[]) {
    this.internalMap[name] = l;
  }

  get(name: string): Word[] {
    console.log(typeof toRaw<Word[]>(this.internalMap[name]));
    return toRaw<Word[]>(this.internalMap[name]);
  }
}
