// 选创建单选还是多选的界面
import { Link } from 'react-router-dom'
import './Create.css'

export default function Create() {

  return (
    <div>
    <div className="card">
      <Link to="/create-vote">
        <img className="card-img" />
        创建单选
      </Link>
    </div>
      <div className="card">
        <Link to="/create-vote?multiple=1">
          <img className="card-img" />
          创建多选
        </Link>
      </div>
    </div>
  )
}
