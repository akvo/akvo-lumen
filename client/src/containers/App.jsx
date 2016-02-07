import React from 'react';
import { Component } from 'react';
import { Router, Route, IndexRedirect, browserHistory } from 'react-router';
import Library from '../components/Library';
import Datasets from '../components/Datasets';
import CreateDataset from '../components/CreateDataset';
import EditVisualisation from '../components/EditVisualisation';
import Visualisations from '../components/Visualisations';
import Dashboards from '../components/Dashboards';
import Main from '../components/Main';

class App extends Component {
  render() {
    return (
      <Router history={browserHistory}>
        <Route path="/" component={Main}>
          <IndexRedirect from="" to="library"/>
          <Route path="library" component={Library}>
            <Route path=":collection" component={Library}/>
            <Route path="/dataset/create" component={CreateDataset}/>
          </Route>
          <Route path="visualisation/create" component={EditVisualisation}/>
          <Route path="visualisation/:id" component={EditVisualisation}/>
          <Route path="datasets" component={Datasets}/>
          <Route path="visualisations" component={Visualisations}/>
          <Route path="dashboards" component={Dashboards}/>
        </Route>
      </Router>
    );
  }
}

export default App;
