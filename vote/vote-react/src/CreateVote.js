// 真正用于创建投票的界面

import { useImmer } from 'use-immer'
import { useMemo } from 'react'
import { useInput, useBooleanInput, useQuery, forceLogin } from './hooks'
import { useHistory } from 'react-router-dom'
import axios from 'axios'
import dayjs from 'dayjs'

function CreateVote({ userInfo }) {
  var [options, setOptions] = useImmer(['', ''])
  var title = useInput()
  var desc = useInput()
  var deadline = useInput(useMemo(() => dayjs().add(1, 'year').format('YYYY-MM-DDTHH:mm'), []))
  var anonymous = useBooleanInput()
  var history = useHistory()
  var query = useQuery()

  function remove(idx) {
    setOptions(options => {
      options.splice(idx, 1)
    })
  }

  function setOption(idx, val) {
    setOptions(options => {
      options[idx] = val
    })
  }

  async function create() {
    var vote = {
      title: title.value,
      desc: desc.value,
      options: options,
      deadline: deadline.value,
      anonymous: anonymous.checked,
      multiple: query.get('multiple') === '1' ? true : false,
    }
    console.log(vote)

    try {
      debugger

      var res = await axios.post('/vote', vote)
      var createdVote = res.data.result // data里应该有创建好的投票信息，如：创建者，投票id
      console.log(createdVote)
      history.push('/view-vote/' + createdVote.voteId)
    } catch (e) {
      throw e
    }
  }

  return (
    <div>
      <h1>创建投票</h1>
      <div><input type="text" placeholder="投票标题" {...title}/></div>
      <div><input type="text" placeholder="补充描述(选填)" {...desc}/></div>

      {
        options.map((option, idx) =>
          <div key={idx}>
            <input type="text" placeholder="选项" value={option} onChange={e => setOption(idx, e.target.value)}/>
            <button tabIndex="-1" onClick={() => remove(idx)}>-</button>
          </div>
        )
      }
      <div><button onClick={() => setOptions(options => { options.push('') })}>添加选项</button></div>
      <div>截止日期:<input type="datetime-local" {...deadline} /></div>
      <div>匿名投票:<input type="checkbox" {...anonymous} /></div>
      <div><button onClick={create}>创建投票</button></div>
    </div>
  )
}

export default forceLogin(CreateVote)
