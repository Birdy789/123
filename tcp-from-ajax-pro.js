var net = require('net') //获取tcp模块
var fs = require('fs')//文件系统模块


var server = net.createServer() //创建tcp服务器
var port = 80
server.listen(port, () => {
  console.log('listen on port', port)

})

var messages = []

function saveMessages() {
  var str = JSON.stringify(messages)
  fs.writeFileSync('./messages.json', str)
}

//当服务器收到一个客户端连接时（浏览器每发一个请求，这个事件就会触发一次）
server.on('connection', (conn => {
  //  连接上收到数据时,从浏览器发来的数据，服务器收到的
  conn.on('data', data => {
    var str = data.toString()

    var [header, body] = str.split('\r\n\r\n') //解构
    var [head, ...rest] = header.split('\r\n')
    var [method, url] = head.split(' ')
    console.log(method, url, body)
    var info = parseQstring(body)
    console.log(info)

    if (url == '/mesg' && method == 'POST') {
      var info = parseQstring(body)
      info.time = new Date().toString()
      messages.push(info)
      saveMessages()
      conn.write('HTTP/1.1 200 OK\r\n')
      // conn.write('Location: /\r\n') //重新跳转到首页
      conn.write('\r\n')
      conn.end()
    }

    if (url == '/messages') {  //留言板json 数据库

      var data = fs.readFileSync('./messages.json')
      conn.write('HTTP/1.1 200 OK\r\n')
      conn.write('Content-Type:application/json\r\n')
      conn.write('\r\n')

      conn.write(data)
      conn.end()
    }

    if (url == '/') {
      conn.write('HTTP/1.1 200 OK hhh\r\n')
      conn.write('Content-Type:text/html;charset=UTF-8\r\n') //charset=UTF-8 不要引号
      conn.write('\r\n')
      conn.write(`
      <form method ="POST" action ="/mesg">
        <fieldset>
        <legend>留言板</legend>
          <p> Name:<input type ="text" name ="name" class='name'> </p>
          <p> Message:<br> <textarea  cols="50" rows="5" name ="message" class='message'></textarea> </p>
          <p> <button onclick="liuyan()"> Send </button> </p>
        </fieldset>
      </form >

      <div id="messagesDiv"></div>

      <script>
        var nameInput = document.querySelector('.name')
        var messageInput = document.querySelector('.message')
        var messagesDiv = document.querySelector('#messagesDiv')

        function liuyan() {
          // 获取表单数据，发请求
          event.preventDefault()
          var name = nameInput.value
          var message = messageInput.value

          var xhr = new XMLHttpRequest()
          xhr.open('POST', '/mesg')
          xhr.onload = function() {
            nameInput.value = messageInput.value = ''
            init() 
          }

          xhr.send('name=' + name + '&message=' + message)
        }

        function init(){
          messagesDiv.textContent = ''//清空div
          var xhr=new XMLHttpRequest()
          xhr.open("get",'/messages')
          xhr.onload=function(e){
            var messages=JSON.parse(xhr.responseText) // 拿到"get",'/messages' 返回的数据data
            for (var i = messages.length - 1; i >= 0; i--) {
              var msg = messages[i]
              var div = document.createElement('div')
              div.textContent = msg.name + ' - ' + msg.message  + '@'+ msg.time
              messagesDiv.append(div)
            }
          }
          xhr.send()
        }

        init()
       
      </script>
      `)


      conn.end()

    }

    if (url == '/favicon.ico') {
      var img = fs.readFileSync('./fav.png')
      conn.write('HTTP/1.1 200 OK\r\n')
      conn.write('Content-Type: image/png\r\n')
      conn.write('\r\n')

      conn.write(img)
      conn.end()
    }


  })
}))

var querystring = require('querystring') //解析查询字符串

function parseQstring(str) {
  return querystring.parse(str)

}


function escape(s) {
  // Converts the characters "&", "<", ">", '"', and "'" in string to their corresponding HTML entities.
  var ans = ""
  for (let i = 0; i < s.length; i++) {
    switch (s[i]) {
      case "&":
        ans += "&amp;";
        break;
      case "<":
        ans += "&lt;";
        break;
      case ">":
        ans += "&gt;";
        break;
      case "\"":
        ans += "&quot;";
        break;
      case "\'":
        ans += "&apos;";
        break;
      default:
        ans += s[i];
    }
  }
  return ans
}


