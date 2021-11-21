import { Link } from "react-router-dom"
import { forceLogin, useAxios } from "./hooks"


function MyVotes({ userInfo }) {
  var { loading, data, error, update } = useAxios({ url: '/vote' })

  if (loading) return null

  return (
    <div>
      我的投票
      <ul>
        {
          data.map(vote => {
            return (
              <li key={vote.voteId}>
                <Link to={"/view-vote/" + vote.voteId}>{vote.title}</Link>

                <span style={{ color: '#3269da' }}>[{vote.multiple ? '多选' : '单选'}]</span>
                <span style={{ color: '#3269da' }}>[{vote.anonymous ? '匿名' : '公开'}]</span>
              </li>
            )
          })
        }
      </ul>
    </div>
  )
}

export default forceLogin(MyVotes)
