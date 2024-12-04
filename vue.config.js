const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    host: '::',
    port: 8080,
    allowedHosts: 'all'
  }
})
