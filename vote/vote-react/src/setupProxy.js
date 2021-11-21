const { createProxyMiddleware } = require('http-proxy-middleware');


module.exports = function (app) {
  app.use(
    createProxyMiddleware('/account', { target: 'http://localhost:8081' }),
    createProxyMiddleware('/vote', { target: 'http://localhost:8081' }),
    createProxyMiddleware('/realtime-voteinfo', { target: 'ws://localhost:8081', ws: true }),
  );
};


// (pathname, req) => {
//   // console.log(req)
//   if (!req.headers.accept) {
//     return false
//   }
//   if (req.headers.accept == ('*/*')) {
//     return false
//   }
//   return !req.headers.accept.includes('text/html')
// },
