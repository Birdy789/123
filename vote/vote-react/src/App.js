import './App.css';
import * as ReactRouter from 'react-router-dom'
import { Switch, Route, NavLink, MemoryRouter as HashRouter, Redirect } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Main from './Main';
import CreateVote from './CreateVote';
import ViewVote from './ViewVote';
import CurrentUserInfo from './CurrentUserInfo'

console.log(ReactRouter)

function App() {
  return (
    <CurrentUserInfo>
      <HashRouter>
        <div className="App">

          <Switch>
            <Route path="/" exact>
              <Redirect to="/main" />
            </Route>
            <Route path="/main" component={Main}>
            </Route>
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/view-vote/:voteId" component={ViewVote} />
            <Route path="/create-vote" component={CreateVote} />
          </Switch>

        </div>
      </HashRouter>
    </CurrentUserInfo>
  );
}

export default App;
