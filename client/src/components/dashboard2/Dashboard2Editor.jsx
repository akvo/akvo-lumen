import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { intlShape } from 'react-intl';

import Dashboard2EditorCanvas from './Dashboard2EditorCanvas';
import Dashboard2EditorSidebar from './Dashboard2EditorSidebar';

require('../dashboard/DashboardEditor.scss');

export default class Dashboard2Editor extends Component {
  render() {
    return (
      <div className="DashboardEditor">
        <Dashboard2EditorSidebar {...this.props} />
        <Dashboard2EditorCanvas {...this.props} />
      </div>
    );
  }
}

Dashboard2Editor.propTypes = {
  intl: intlShape,
  dashboard: PropTypes.object.isRequired,
  library: PropTypes.object,
  onUpdateEntities: PropTypes.func.isRequired,

};
