import axios, { Axios } from "axios";
import type {AxiosInstance} from "axios";
import { randomUUID } from "crypto";
import CryptoJS from 'crypto-js'
import qs from 'qs'
import exp from "constants";


const client:AxiosInstance = axios.create({
  baseURL: "https://openapi.youdao.com/api"
})

export const playSound = (req:string) => {
  return client.get(req)
}

function truncate(q:string){
  let len = q.length;
  if(len<=20) return q;
  return q.substring(0, 10) + len + q.substring(len-10, len);
}

export const searchReq = (word: string) => {
  let appKey = '66d6ea6d4da72491';
  let key = 'wZlOMLQ33KLnE73Egf9Jf4pzOuZWNA57';//注意：暴露appSecret，有被盗用造成损失的风险
  let salt = (new Date).getTime();
  let curtime = Math.round(new Date().getTime()/1000);
  let curTimeStr = curtime.toString()
// 多个query可以用\n连接  如 query='apple\norange\nbanana\npear'
  let from = 'en';
  let to = 'zh-CHS';
  let str1 = appKey + truncate(word) + salt + curtime + key;
  let sign = CryptoJS.SHA256(str1).toString(CryptoJS.enc.Hex);
  let saltStr:string = salt.toString();
  return client.request( {
    url: "/",
    method: 'post',
    data: qs.stringify({
      q: word,
      appKey,
      salt:saltStr,
      curtime:curTimeStr,
      signType: 'v3',
      to,
      sign,
      from,
    })
  }
  )
}

export default client;