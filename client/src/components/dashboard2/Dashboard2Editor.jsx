import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { intlShape } from 'react-intl';

import Dashboard2EditorCanvas from './Dashboard2EditorCanvas';
import Dashboard2EditorSidebar from './Dashboard2EditorSidebar';

require('../dashboard/DashboardEditor.scss');

export default class Dashboard2Editor extends Component {
  render() {
    const { dashboard } = this.props;
    return (
      <div className="DashboardEditor">
        <Dashboard2EditorSidebar dashboard={dashboard} />
        <Dashboard2EditorCanvas dashboard={dashboard} />
      </div>
    );
  }
}

Dashboard2Editor.propTypes = {
  intl: intlShape,
  dashboard: PropTypes.object.isRequired,
};
