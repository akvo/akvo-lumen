import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { routeActions } from 'react-router-redux';
import WorkspaceNav from './WorkspaceNav';

require('../styles/reset.global.scss');
require('../styles/style.global.scss');
require('../styles/Main.scss');
require('fixed-data-table/dist/fixed-data-table.css');

class Main extends Component {
  render() {
    return (
      <div className="Main">
        <WorkspaceNav
          collections={this.props.collections}
          user={this.props.user}
          location={this.props.location}
        />
      {this.props.children}
      </div>
    );
  }
}

Main.propTypes = {
  children: PropTypes.element,
  user: PropTypes.object,
  collections: PropTypes.array,
  location: PropTypes.object,
};

function select(state) {
  return state;
}

export default connect(
  select,
  routeActions
)(Main);
