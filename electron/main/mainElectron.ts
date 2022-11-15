import { app, BrowserWindow, ipcMain, screen } from "electron";
import type { Config } from "../../src/interface/typings";
import { accessSync, readFileSync, stat, writeFileSync } from "fs";
import path from "path";
import {access, constants, writeFile } from "fs";

const YAML = require("yaml");

//app 控制应用程序的事件生命周期。
//BrowserWindow 创建并控制浏览器窗口。
let win: BrowserWindow;
//定义全局变量获取 窗口实例
// 创建窗口
let width;
let height;
let centerY;
let centerX;
let initX;
let initY;
const createWindow = () => {
  // 获得本机分辨率
  // Create the browser window.
  const size = screen.getPrimaryDisplay().workAreaSize;
  width = parseInt(String(size.width * 0.65));
  height = parseInt(String(size.height * 0.7));
  centerY = parseInt(String(size.height * 0.5 - height / 2));
  centerX = parseInt(String(size.width * 0.5 - width / 2));
  initY = parseInt(String(size.height * 0.04));
  initX = parseInt(String(size.width * 0.75));
  win = new BrowserWindow({
    webPreferences: {
      devTools: true,
      contextIsolation: false,
      nodeIntegration: true,
      webSecurity: false
      // nodeIntegrationInWorker: true
    },
    transparent: true,
    width: 400,
    height: 380,
    maximizable: true,
    autoHideMenuBar: true,
    fullscreen: false,
    frame: false,
    // titleBarStyle: "hidden",
    resizable: false
    // fullscreen: true
  });
  win.setPosition(initX, initY);
  console.log(app.isPackaged);
  // win.loadFile(path.join(__dirname, "../dist/index.html")).catch(reason => {
  //   console.log(reason);
  // })
  // console.log(path.join(__dirname, "../dist/index.html"));
  win.loadFile(path.join(__dirname, "./index.html")).catch((reason) => {
    console.log(reason);
  });

  // if(process.env.VITE_DEV_SERVER_URL){
  //   win.loadFile(path.join(__dirname, "../dist/index.html"));
  // }else{
  //   win.loadURL(`${process.env['VITE_DEV_SERVER_URL']}`)
  // }
  // win.loadURL(`${process.env['VITE_DEV_SERVER_URL']}`).then(() => {
  //   win!.setMovable(true)
  // })
};

// 读取配置
function getConfig() {
  console.log(app.getAppPath());
  let configPath = path.join(app.getAppPath(), ".." ,"config.yaml")
  console.log(configPath);
  let conf;
  try {
    accessSync(configPath, constants.F_OK);
  } catch (erro) {
    if (erro) {
      let defaultConf = {
        repository: {
          name: "repo",
          classes:
            ["kaoyan"]
        },
        user: null as null
      };
      let s = YAML.stringify(defaultConf);
      writeFileSync(configPath, s, "utf-8");
      conf = defaultConf
    }
  } finally {
    if (!conf) {
        const file: string = readFileSync(configPath, "utf-8");
        conf = YAML.parse(file)
      }
    }
  console.log("???");
  console.log(conf);
  return conf;
}

// 设置配置
function setConfig(confStr: string) {
  let configPath = path.join(app.getAppPath(), ".." ,"config.yaml")
  console.log("setConfigPath:", configPath);
  console.log(confStr);
  const conf: Config = JSON.parse(confStr);
  const s = YAML.stringify(conf);
  writeFileSync(configPath, s, "utf-8");
}

app.whenReady().then((value) => {
  // 事件处理
  ipcMain.on("set-title", (event, title) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    win!.setTitle(title);
  });
  ipcMain.on("close-window", (event) => {
    win!.close();
  });
  ipcMain.on("move-window", (event, x: number, y: number) => {
    let startX: number, startY: number;
    [startX, startY] = win!.getPosition();
    x = startX + x;
    y = startY + y;
    win!.setPosition(x, y, true);
  });
  ipcMain.on("config-rewrite", (event) => {
  });
  ipcMain.handle("config-get", getConfig);
  ipcMain.on("config-set", (event, conf: string) => {
    setConfig(conf);
  });
  ipcMain.handle("panel-size", (event) => {
    return win.getSize();
  });
  ipcMain.on("main-show", (event) => {
    console.log(1);
    win.setResizable(true);
    win.setSize(400, 380);
    win.setResizable(false);
    win.setPosition(initX, initY);
  });
  createWindow();
  ipcMain.on("panel-show", (event) => {
    win.setResizable(true);
    win.setPosition(centerX, centerY);
    win.setSize(width, height);
    win.center();
  });
  ipcMain.on("config-show", (event) => {
    win.setResizable(true);
    win.setPosition(centerX, centerY);
    const tempWidth = parseInt((width / 2.2).toString());
    const tempHeight = parseInt((height / 1.8).toString());
    win.setSize(tempWidth, tempHeight);
    win.center();
  });
});
