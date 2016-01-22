import React from 'react';
import { Component } from 'react';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';
import Library from '../components/Library';
import Datasets from '../components/Datasets';
import Visualisations from '../components/Visualisations';
import Dashboards from '../components/Dashboards';
import Main from '../components/Main';

class App extends Component {
  render() {
    return (
      <Router history={browserHistory}>
        <Route path="/" component={Main}>
          <IndexRoute component={Library}/>
          <Route path="datasets" component={Datasets}/>
          <Route path="visualisations" component={Visualisations}/>
          <Route path="dashboards" component={Dashboards}/>
        </Route>
      </Router>
    );
  }
}

export default App;
