// 投票查看及交互页面

import { useParams } from "react-router-dom"
import axios from "axios"
import { useEffect, useState, useMemo } from "react"
import { forceLogin, useAxios } from './hooks'
import './ViewVote.css'
import _ from 'lodash'
import dayjs from 'dayjs'
import { useImmer } from "use-immer"



/**
 * 投票页面的信息是实时更新的
 * 实现这个需求有两种方案：
 * 一是页面加载成功后一直不断的发ajax请求来获取最新的数据，并展示出来
 *  这种做法在投票已经创建出很久以后就不够好了，因为如果创建出很久以后，大概率是不会更新的
 *  发出请求大概率是没有获取到最新信息的
 * 第二种方案为http长连接，也叫comet，即服务器在收到客户端发来的ajax请求后
 *  如果没有数据要回复给客户端，则服务器hold住这个连接，直到超时后响应空内容，或在有数据后立刻响应该请求
 *    微信/钉钉的登陆都是这个方案
 * 第三种：websocket
 *  页面加载成功后向服务器建立一个websocket连接，如果服务器有新的数据，则直接在这个ws连接上响应客户端
 *    而不用客户端主动的一直发请求
 *
 *
 *
 */
function ViewVote({ userInfo }) {
  var { voteId } = useParams()
  var { loading, data, error, update } = useAxios({ url: `/vote/${voteId}` })
  var [userVotes, setUserVotes] = useState() // 从websocket上获取到的实时信息
  var [selectedOptionIds, setSelectedOptionIds] = useImmer([])

  useEffect(() => {
    // debugger
    // 如果还在加载，或者是超过截止时间，则什么也不做
    if (loading || Date.now() > new Date(data.vote.deadline).getTime()) {
      return
    }

    var wsUrl = `${window.location.protocol.replace('http', 'ws')}//${window.location.host}/realtime-voteinfo/${voteId}`
    // var wsUrl = `ws://localhost:8081/realtime-voteinfo/${voteId}`

    console.log(wsUrl)
    var ws = new WebSocket(wsUrl)

    // 服务器发来的就是当前投票的最新投票信息
    ws.onmessage = function (e) {
      var data = JSON.parse(e.data)
      console.log('从websocket获取到的实时投票信息', data)
      setUserVotes(data)
    }

    return () => ws.close()
  }, [loading, voteId])

  // 为某个选项投票/或取消投票
  async function voteOption(option) {
    if (!data.vote.anonymous) {
      var { optionId } = option
      await axios.post(`/vote/${voteId}`, {
        optionIds: [optionId]
      })
    } else { // 匿名的话，发选中的
      await axios.post(`/vote/${voteId}`, {
        optionIds: selectedOptionIds
      })
      setSelectedOptionIds([])
    }
  }

  function selectOption(option) {
    var { optionId } = option
    if (selectedOptionIds.includes(optionId)) {
      setSelectedOptionIds(selectedOptionIds => {
        var idx = selectedOptionIds.indexOf(optionId)
        selectedOptionIds.splice(idx, 1)
      })
    } else {
      setSelectedOptionIds(selectedOptionIds => {
        selectedOptionIds.push(optionId)
      })
    }
  }

  function handleOptionClick(option) {
    if (data.vote.anonymous) {
      if (votes.some(it => it.userId === userInfo.data.userId)) {
        return
      }
      selectOption(option)
    } else {
      voteOption(option)
    }
  }

  var votes = userVotes ?? data?.userVotes ?? []

  var groupedVotes    = useMemo(() => _.groupBy(votes, 'optionId'), [votes])
  var uniqueUserCount = useMemo(() => _.uniqBy(votes, 'userId').length, [votes]) // 去重后用户数量

  // console.log('分组后的投票数据', groupedVotes)
  // console.log('去重后的投票人数', uniqueUserCount)

  if (loading) return 'Loading...'

  return (
    <div>
      <h2>{data.vote.title}</h2>
      <span style={{color: '#3269da'}}>[{data.vote.multiple ? '多选' : '单选'}]</span>
      <span style={{color: '#3269da'}}>[{data.vote.anonymous ? '匿名' : '公开'}]</span>
      <h3>{data.vote.desc}</h3>
      <ul>
        {
          data.options.map(option => {
            // option 是选项本身
            // 当前选项的票数信息
            var thisOptionVotes = groupedVotes[option.optionId] || []

            return (
              <li onClick={() => handleOptionClick(option)} key={option.optionId}>
                {option.content}
                [{thisOptionVotes.length}票]
                [{uniqueUserCount == 0 ? 0 : (thisOptionVotes.length / uniqueUserCount * 100).toFixed(2)}%]

                {/* 当选选项的任意一票是当前登陆用户，则说明当前用户已经选择该选项 */}
                {thisOptionVotes.some(it => it.userId == userInfo.data.userId) ? '✔️' : ''}

                {selectedOptionIds.includes(option.optionId) ? '✔️' : ''}

                <div/>
                {/* {
                  thisOptionVotes.map(oneVote => {
                    return <img width="32" height="32" src={oneVote.avatar ?? 'https://www.12306.cn/index/images/service.png'} style={{borderRadius: '9999px', margin: '2px'}} />
                  })
                } */}
                {
                  thisOptionVotes.map(oneVote => {
                    return <span key={oneVote.userId} className="user-id">{oneVote.userId}</span>
                  })
                }
              </li>
            )
          })
        }
      </ul>

      {/* 匿名且当前用户没投过才显示确定投票 */}
      {!!data.vote.anonymous && !votes.some(it => it.userId == userInfo.data.userId) &&
        <button disabled={!selectedOptionIds.length} onClick={voteOption}>确定投票</button>
      }

      <p>投票截止: {dayjs(data.vote.deadline).format('YYYY-MM-DD HH:mm')}</p>
    </div>
  )
}

export default forceLogin(ViewVote)
