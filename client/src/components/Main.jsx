import React from 'react';
import { Component } from 'react';
import { connect } from 'react-redux';
import { routeActions } from 'redux-simple-router';
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
  children: React.PropTypes.element,
  user: React.PropTypes.object,
  collections: React.PropTypes.array,
};

function select(state) {
  return state;
}

export default connect(
  select,
  routeActions
)(Main);
