
import { Link } from 'react-router-dom'

export default function RequireLogin() {
  return (
    <div>
      <h2>需要登陆</h2>
      <Link to="/login">登陆</Link>
    </div>
  )
}
