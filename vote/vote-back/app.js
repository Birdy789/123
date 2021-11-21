const express = require('express')
const multer = require('multer')
const svgCaptcha = require('svg-captcha')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const { WebSocketServer } = require('ws')
console.log(WebSocketServer)
const http = require('http')
const server = http.createServer()
const querystring = require('querystring')
const _ = require('lodash')

const cookieSecret = 'cookie sign secert'

// WebSocketServer接管了server的upgrade事件
const wss = new WebSocketServer({ server })


// 本映射从投票id映射到响应这个投票最新信息的websocket
const voteWsMap = {
  // 2: [ws, ws, ws], // 2号投票有3个连接
  // 5: [ws, ws, ws, ws], // 5号投票有4个连接等待更新
}

console.log('voteWsMap', voteWsMap)

// ws://localhost:3001/realtime-voteinfo/2
wss.on('connection', (ws, req) => {
  var parsedCookie = cookieParser.signedCookies(querystring.parse(req.headers.cookie, '; '), cookieSecret)

  var loginUserName = parsedCookie.loginUser

  if (!loginUserName) {
    ws.close()
    return
  }

  var user = db.prepare('SELECT * FROM users WHERE name = ?').get(loginUserName)
  ws.user = user

  // 必须匹配这种形式的地址才可以连接
  if (req.url.match(/^\/realtime-voteinfo\/\d+$/)) {
    var voteId = req.url.match(/\d+$/)
    // ws应该被保存起来以在这个vote更新时将最新信息发给这个ws
    if (voteWsMap[voteId]) {
      voteWsMap[voteId].push(ws)
    } else {
      voteWsMap[voteId] = [ws]
    }

    // 当连接断开时，从映射中删除这个ws连接
    ws.on('close', () => {
      var idx = voteWsMap[voteId].indexOf(ws)
      voteWsMap[voteId].splice(idx, 1)
    })
  } else {
    ws.close()
  }
})


const accountRouter = require('./account')
const db = require('./db')
const exp = require('constants')

const port = 8081

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + '/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.random().toString(16).slice(2) + path.extname(file.originalname)) //Appending extension
  }
})

const upload = multer({ storage: storage })

const app = express()

app.use((req, res, next) => {
  console.log(req.method, req.url)
  next()
})

app.use(cors({
  // maxAge: 86400, // 预检请求的有效期
  origin: true, // 写为true让响应头的Access-Control-Allow-Origin为请求者的域
  credentials: true, // 让预检请求的响应中有Access-Control-Allow-Credentials: true这个头，以允许跨域请求带上cookie
}))

app.use(express.static(__dirname + '/build'))
app.use(cookieParser(cookieSecret)) // cookie签名的密码
app.use('/uploads', express.static(__dirname + '/uploads')) // 用于响应用户上传的头像请求
app.use(express.json()) // 解析json请求体的中间件
app.use(express.urlencoded({ extended: true })) // 解析url编码请求体的中间件

// 将用户是否登陆放到req的isLogin字段上的中件间
// 查出已登陆用户放到loginUser上
app.use((req, res, next) => {
  if (req.signedCookies.loginUser) {
    var name = req.signedCookies.loginUser
    req.isLogin = true
    req.loginUser = db.prepare('SELECT * FROM users WHERE name = ?').get(name)
  } else {
    req.isLogin = false
    req.loginUser = null
  }
  next()
})

app.use('/account', accountRouter)

// POST   /vote    创建投票，信息在请求体
// GET    /vote/8  获取投票题目的信息
// DELETE /vote/8  删除8号投票
// PUT    /vote/8  修改投票，信息在请求体


// 返回当前登陆用户创建的所有投票
app.get('/vote', (req, res, next) => {
  if (req.loginUser) {
    var votes = db.prepare('SELECT * FROM votes WHERE userId = ?').all(req.loginUser.userId)
    res.json({
      code: 0,
      result: votes,
    })
  } else {
    res.status(403).json({
      code: -1,
      msg: 'user not login'
    })
  }
})

app.post('/vote', (req, res, next) => {
  var vote = req.body

  var userId = req.loginUser?.userId
  if (userId != undefined) {

    var stmt = db.prepare('INSERT INTO votes (userId, title, desc, deadline, anonymous, multiple) VALUES (?,?,?,?,?,?)')
    var result = stmt.run(req.loginUser.userId, vote.title, vote.desc, vote.deadline, Number(vote.anonymous), Number(vote.multiple))

    var voteId = result.lastInsertRowid

    var stmt2 = db.prepare('INSERT INTO options (voteId, content) VALUES (?,?)')
    for (var option of vote.options) { // vote.options就是一个字符串数组
      stmt2.run(voteId, option)
    }

    res.json({
      code: 0,
      result: {
        voteId,
      }
    })
  } else {
    res.json({
      code: -1,
      msg: '用户未登陆',
    })
  }

})
app.get('/vote/:voteId', (req, res, next) => {
  var { voteId } = req.params

  var vote = db.prepare('SELECT * FROM votes WHERE voteId = ?').get(voteId)

  if (vote) {
    var options = db.prepare('SELECT * FROM options WHERE voteId = ?').all(voteId)
    var userVotes = db.prepare(`
      SELECT optionId, avatar, voteOptions.userId
      FROM voteOptions
      JOIN users
      ON voteOptions.userId = users.userId
      WHERE voteId = ?
    `).all(voteId)

    if (vote.anonymous && req.loginUser.userId != vote.userId) {
      userVotes.forEach(it => {
        if (it.userId !== req.loginUser.userId) {
          it.userId = '秘'
          it.avatar = '秘'
        }
      })
    }

    res.json({
      code: 0,
      result: {
        vote,
        options,
        userVotes,
      }
    })
  } else {
    res.status(404).json({
      code: -1,
      msg: 'can not find this vote: ' + voteId,
    })
  }
})
app.delete('/vote/:voteId', (req, res, next) => {
  if (req.loginUser) {
    var { voteId } = req.params
    var vote = db.prepare('SELECT * FROM votes WHERE voteId = ?').get(voteId)
    if (vote.userId == req.loginUser.userId) {
      db.prepare('DELETE FROM votes WHERE voteId = ?').run(voteId)
    } else {
      res.status(401).json({
        code: -1,
        msg: '并非你创建的'
      })
    }
  } else {
    res.status(401).json({
      code: -1,
      msg: 'mei deng lu'
    })
  }
})




// POST /vote/3
// {optionIds: [5, 8, 9]}

// 切换当前登陆用户对voteId问题的optionId选项的投递情况，匿名的则就不能切换了
app.post('/vote/:voteId', (req, res, next) => {
  var { voteId } = req.params
  var { optionIds } = req.body

  // 如果请求体没有选项
  if (optionIds.length == 0) {
    res.status(401).json({
      code: -1,
      msg: '必须有选项'
    })
  }

  var optionId = optionIds[0] // 单选的话只有一个id发来，就算发来多个，也只用第一个

  var userId = req.loginUser?.userId

  console.log('投票时的用户id', userId)

  // 如果用户未登陆，则不能投票
  if (!userId) {
    res.status(401).json({
      code: -1,
      msg: 'user not login!'
    })
    return
  }

  var vote = db.prepare('SELECT * FROM votes WHERE voteId = ?').get(voteId)
  if (vote) {

    // 如果已过截止时间，是返回403
    if (Date.now() > new Date(vote.deadline).getTime()) {
      res.status(403).json({
        code: -1,
        msg: 'vote deadline passed'
      })
      return
    }

    var multiple = vote.multiple
    if (multiple) { // 多选

      // 匿名投票
      if (vote.anonymous) {
        let voted = db.prepare('SELECT * FROM voteOptions WHERE userId = ? AND voteId = ?').get(userId, voteId)
        if (voted) {
          res.status(403).json({
            code: -1,
            msg: '该用户已经投过这个匿名投票'
          })
        } else {
          let insertVotes = db.prepare('INSERT INTO voteOptions (userId, voteId, optionId) VALUES (?, ?, ?)')
          optionIds.forEach(optionId => {
            insertVotes.run(userId, voteId, optionId)
          })
          res.end() // 投票完成，直接结束
        }
      } else {
        // 非匿名投票，一次只投一个选项
        // 先看用户是否已经投过这个选项
        let voted = db.prepare('SELECT * FROM voteOptions WHERE userId = ? AND voteId = ? AND optionId = ?')
          .get(userId, voteId, optionId)


        if (voted) { // 如果已经投过这个选项，则删除它
          db.prepare('DELETE FROM voteOptions WHERE voteOptionId = ?').run(voted.voteOptionId)
        } else { // 如果没有投过，则增加一行，表示用户投了这个选项
          db.prepare('INSERT INTO voteOptions (userId, voteId, optionId) VALUES (?, ?, ?)')
            .run(userId, voteId, optionId)
        }
        res.end()
      }

    } else { // 单选
      let voted = db.prepare('SELECT * FROM voteOptions WHERE userId = ? AND voteId = ?')
        .get(userId, voteId)
      if (voted) { // 投过，修改或取消

        // 单选匿名，投过，直接返回
        if (vote.anonymous) {
          res.status(403).json({
            code: -1,
            msg: '匿名投票投过就不能修改!'
          })
        } else {
          if (voted.optionId == optionId) { // 已经投的就是这次点的，则直接取消
            db.prepare('DELETE FROM voteOptions WHERE voteOptionId = ?').run(voted.voteOptionId)
          } else { // 已经投的跟这次点的不一样，则换成这次选的
            db.prepare('UPDATE voteOptions SET optionId = ? WHERE voteOptionId = ?').run(optionId, voted.voteOptionId)
          }
        }
      } else { // 没投过，则增加
        db.prepare('INSERT INTO voteOptions (userId, voteId, optionId) VALUES (?, ?, ?)')
          .run(userId, voteId, optionId)
      }
      res.end()
    }

    // 把最新的当前投票数据拿到，并发给在等待这个投票最新信息的ws们
    var userVotes = db.prepare(`
      SELECT optionId, avatar, voteOptions.userId
      FROM voteOptions
      JOIN users
      ON voteOptions.userId = users.userId
      WHERE voteId = ?
    `).all(voteId)

    if (voteWsMap[voteId]) {
      voteWsMap[voteId].forEach(ws => {
        var userId = ws.user.userId

        var cloned = _.cloneDeep(userVotes)

        // 如果是匿名，且登陆用户不是当前投票的创建者，则抹去其它登陆用户的信息
        if (vote.anonymous && userId !== vote.userId) {
          cloned.forEach(it => {
            if (it.userId != userId) {
              it.userId = '秘'
              it.avatar = '秘'
            }
          })
        }

        ws.send(JSON.stringify(cloned))
      })
    }

  } else { // 如果投票不存在
    res.status(404).json({
      code: -1,
      msg: 'vote not exist: ' + voteId
    })
  }
})



app.post('/upload', upload.any(), (req, res, next) => {
  var files = req.files
  console.log(files)
  var urls = files.map(file => `/uploads/` + file.filename)
  res.json(urls)
})


app.use(function (req, res, next) {
  res.end('ok')
})


// app.listen(port, () => {
//   console.log('vote app listening on port', port)
// })

// 将express创建的app绑定到http server的request事件上
server.on('request', app)

server.listen(port, () => {
  console.log('vote app listening on port', port)
})
