const express = require('express');
const app = express()
const readline = require('readline')


app.get('/', (req, res, next) => {

  res.sendFile(__dirname + '/comet-test.html')

})

var pendingRequests = []

app.get('/boardcast', (req, res, next) => {
  pendingRequests.push(res) // 把每个请求存起来，eg有很多个用户向它发
})

app.listen(5000, () => {
  console.log('listening on port', 5000)
  rl.prompt()
})

// c:scanf     python:input()    java:System.in.???
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '请输入广播> '
})

console.log('请打开 http://localhost:5000/ 并查看网页控制台')
console.log('然后在node控制台中输入内容，网页端会在输入完后立刻显示')

rl.on('line', (line) => {
  pendingRequests.forEach(res => {
    res.end(line)
  })
  rl.prompt()
})

// start()

// async function start() {
//   console.log('请打开 http://localhost:5000/ 并查看网页控制台')
//   console.log('然后在node控制台中输入内容，网页端会在输入完后立刻显示')
  // for await (var line of rl[Symbol.asyncIterator]()) {
  //   pendingRequests.forEach(res => {
  //     res.end(line)
  //   })
  // }
// }
