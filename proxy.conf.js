module.exports = {
  '/api/notifications/stream': {
    target: 'https://localhost:8443',
    secure: false,
    changeOrigin: true,
    // Désactiver le buffering pour SSE
    onProxyRes: function(proxyRes, req, res) {
      // Force no buffering for SSE
      proxyRes.headers['X-Accel-Buffering'] = 'no';
      proxyRes.headers['Cache-Control'] = 'no-cache';
      proxyRes.headers['Connection'] = 'keep-alive';
    }
  },
  '/api': {
    target: 'https://localhost:8443',
    secure: false,
    changeOrigin: true,
    logLevel: 'debug'
  }
};
