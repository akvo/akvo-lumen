import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { routeActions } from 'react-router-redux';
import WorkspaceNav from './WorkspaceNav';

class Main extends Component {
  render() {
    return (
      <div>
        <WorkspaceNav
          collections={this.props.collections}
          user={this.props.user}
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
};

function select(state) {
  return state;
}

export default connect(
  select,
  routeActions
)(Main);
