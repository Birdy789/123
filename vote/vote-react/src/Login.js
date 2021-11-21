
import axios from 'axios'
import { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useInput, useUser } from './hooks'


export default function Login() {
  var name = useInput()
  var password = useInput()
  var history = useHistory()
  var userInfo = useUser()

  useEffect(() => {
    if (userInfo.data) {
      history.goBack()
    }
  })

  async function login() {
    var info = {
      name: name.value,
      password: password.value,
    }

    try {
      var res = await axios.post('/account/login', info) // axios返回的是响应对象
      // let data = res.data // 响应体在响应对象的data字段上
      userInfo.update()
      history.goBack()
    } catch (e) {// 请求成功，但响应码大于等于400在axios里也算失败；网络原因直接请求失败，也会抛
      let data = res.data
      alert(data.msg)
    }
  }

  return (
    <div>
      <div>用户名：</div>
      <input type="text" {...name}/>
      <div>密码：</div>
      <input type="password" {...password}/>
      <div><button onClick={login}>登陆</button></div>
    </div>
  )
}
