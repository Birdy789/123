import { useState, useCallback, useMemo, useEffect, useContext } from 'react'
import { UserContext } from './CurrentUserInfo'
import { useLocation } from 'react-router-dom'
import axios from 'axios'
import RequireLogin from './RequireLogin'


export function useInput(init = '') {
  var [value, setValue] = useState(init)

  var onChange = useCallback(function onChange(e) {
    setValue(e.target.value)
  }, [])

  return {
    value, onChange
  }
}

export function useBooleanInput(init = false) {
  var [checked, setChecked] = useState(init)

  var onChange = useCallback(function onChange(e) {
    setChecked(e.target.checked)
  }, [])

  return {checked, onChange}
}

export function useQuery() {
  var search = useLocation().search
  return useMemo(() => new URLSearchParams(search), [search])
}

export function useAxios(config) {
  var [data, setData] = useState() // 用来存放请求结果的
  var [error, setError] = useState() // 用来存放错误结果的
  var [loading, setLoading] = useState(true) // 用来存放是否还在加载中
  var [i, setI] = useState(0)

  useEffect(() => {
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();

    var req = axios({
      ...config,
      cancelToken: source.token
    })

    req.then(res => {
      if (res.data.code == 0) {
        setData(res.data.result)
        setError(null)
      } else {
        setError(res.data.msg)
      }
      setLoading(false)
    }).catch(e => {
      setError(e.toString())
      setLoading(false)
    })

    return () => source.cancel()
  }, [config.url, i])

  var update = useCallback(function update() {
    setLoading(true)
    setI(i => i + 1)
  }, [])

  return {
    data,
    loading,
    error,
    update,
  }
}




// 拿到当前登陆用户的业务hook
export function useUser() {
  return useContext(UserContext)
}


// 强制登陆的高阶组件，用它包裹的组件必须登陆才能显示
export function forceLogin(Comp) {
  function ForceLoginComp(props) {
    var userInfo = useUser()
    if (userInfo.loading) {
      return null
    }
    if (userInfo.error) {
      return <RequireLogin />
    }
    return <Comp {...props} userInfo={userInfo}/>
  }

  ForceLoginComp.displayName = 'ForceLogin' + (Comp.displayName ?? Comp.name)

  return ForceLoginComp
}
