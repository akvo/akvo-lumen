import React from 'react';
import { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { routeActions } from 'redux-simple-router';

class Main extends Component {
  render() {
    const { children, push } = this.props;
    return (
      <div>
        <ul>
          <li><Link to="/">Library</Link></li>
          <li><Link to="/datasets">Datasets</Link></li>
          <li><Link to="/visualisations">Visualisations</Link></li>
          <li><Link to="/dashboards">Dashboards</Link></li>
          <li><button onClick={() => push('/dashboards')}>Go to /dashboards</button></li>
        </ul>
        <div style={{ marginTop: '1.5em' }}>{children}</div>
      </div>
    );
  }
}

Main.propTypes = {
  children: React.PropTypes.array,
  push: React.PropTypes.func,
};

export default connect(
  null,
  routeActions
)(Main);
