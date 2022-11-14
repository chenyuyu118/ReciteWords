import { app, BrowserWindow, ipcMain, BrowserView, screen, session, Tray, Menu } from "electron";
import { join } from "path";
import type { Config } from "../../src/interface/typings";
import { readFileSync, writeFileSync } from "fs";
import YAML from "yaml";


//app 控制应用程序的事件生命周期。
//BrowserWindow 创建并控制浏览器窗口。
let win: BrowserWindow;
//定义全局变量获取 窗口实例
let configPath = __dirname + "/../electron/config.yaml";
// 创建窗口
let width
let height
let centerY
let centerX
let initX
let initY
let tray
const createWindow = () => {
// 获得本机分辨率
// Create the browser window.
  let size = screen.getPrimaryDisplay().workAreaSize
  width = parseInt(String(size.width * 0.65))
  height = parseInt(String(size.height * 0.7))
  centerY = parseInt(String(size.height * 0.5 - height / 2))
  centerX = parseInt(String(size.width * 0.5 - width / 2))
  initY = parseInt(String(size.height * 0.04));
  initX = parseInt(String(size.width * 0.75));
  win = new BrowserWindow({
    webPreferences: {
      devTools: true,
      contextIsolation: false,
      nodeIntegration: true,
      webSecurity: false,
    },
    // icon: __dirname + "/../electron/start.svg",
    transparent: true,
    width: 400,
    height: 380,
    maximizable: true,
    autoHideMenuBar: true,
    fullscreen: false,
    frame: true,
    titleBarStyle: "hidden",
    resizable: false,
    // fullscreen: true
  })
  win.setPosition(initX, initY)
  win.loadURL(`${process.env['VITE_DEV_SERVER_URL']}`).then(() => {
    win!.setMovable(true)
  })
  win.once('ready-to-show', () => {win?.show()})
}

// 读取配置
function getConfig() {
  const file:string = readFileSync(configPath, 'utf-8')
  return YAML.parse(file);
}

// 设置配置
function setConfig(confStr:string) {
  let conf:Config = JSON.parse(confStr)
  let s = YAML.stringify(conf);
  writeFileSync(configPath, s)
}

// TODO 显示边框
function showFrame(flag:boolean) {

}

let child: BrowserWindow | null;

app.whenReady().then(value => {
  // 事件处理
  ipcMain.on('set-title', (event, title) => {
    const webContents = event.sender
    const win = BrowserWindow.fromWebContents(webContents)
    win!.setTitle(title)
  })
  ipcMain.on('close-window', event => {
    win!.close();
  })
  ipcMain.on('move-window', (event, x:number, y:number)=> {
    let startX:number, startY:number
    [startX, startY] = win!.getPosition()
    x = startX + x;
    y = startY + y;
    win!.setPosition(x, y, true)
  })
  ipcMain.on("config-rewrite", (event) => {})
  ipcMain.handle("config-get", getConfig);
  ipcMain.on("config-set", (event, conf:string) => {setConfig(conf)});
  ipcMain.handle("showFrame", (event, flag:boolean) => {showFrame(flag)});
  ipcMain.handle("panel-size", (event) => {return win.getSize()})
  ipcMain.on("main-show", (event) => {
    console.log(1);
    win.setResizable(true);
    win.setSize(400, 380);
    win.setResizable(false);
    win.setPosition(initX, initY);
  })
  createWindow();
  ipcMain.on("panel-show", (event) => {
    win.setResizable(true);
    win.setPosition(centerX, centerY)
    win.setSize(width, height)
    win.center()
  })
  ipcMain.on("config-show", (event) => {
    win.setResizable(true);
    win.setPosition(centerX, centerY)
    let tempWidth = parseInt((width / 2.2).toString())
    let tempHeight = parseInt((height / 1.8).toString())
    win.setSize(tempWidth, tempHeight)
    win.center()
  })
})

//isPackage 不好使换下面的
//  if(process.env.NODE_ENV != 'development'){
//  win.loadFile(path.join(__dirname, "../index.html"));
//  }else{
//win.loadURL(`http://${process.env['VITE_DEV_SERVER_HOSTNAME']}:${process.env['VITE_DEV_SE//RVER_PORT']}`)
// }
//在Electron完成初始化时被触发

