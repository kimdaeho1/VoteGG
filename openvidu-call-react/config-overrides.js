// config-overrides.js
module.exports = function override(config, env) {
    // WebSocket URL 설정
    if (env === 'development') {
      config.devServer = {
        ...config.devServer,
        client: {
          webSocketURL: 'wss://kimseongwook.shop:8443/sockjs-node', // 수정할 WebSocket URL
        },
      };
    }
    return config;
  };