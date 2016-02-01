import React, { Component, PropTypes } from 'react';
import WorkspaceNav from './WorkspaceNav';

require('../styles/reset.global.scss');
require('../styles/style.global.scss');
require('../styles/Main.scss');
require('fixed-data-table/dist/fixed-data-table.css');

export default class Main extends Component {
  render() {
    return (
      <div className="Main">
        <WorkspaceNav/>
        {this.props.children}
      </div>
    );
  }
}

Main.propTypes = {
  children: PropTypes.element,
};
