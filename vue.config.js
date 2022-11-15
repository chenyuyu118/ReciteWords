module.exports = {
  devServer: {
    proxy: {
      //配置跨域
      "/api": {
        target: "https://openapi.youdao.com/api",
        changOrigin: true, //允许跨域
        pathRewrite: {
          "^/api": ""
        }
      }
    }
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true
    }
  }
};
