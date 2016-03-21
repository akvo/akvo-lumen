import React, { PropTypes } from 'react';
import WorkspaceNav from './WorkspaceNav';
import DashboardModal from './DashboardModal';

require('../styles/reset.global.scss');
require('../styles/style.global.scss');
require('../styles/Main.scss');
require('fixed-data-table/dist/fixed-data-table.css');

export default function Main({ location, children }) {
  return (
    <div className="Main">
      <WorkspaceNav
        location={location}
      />
      {children}
      <DashboardModal />
    </div>
  );
}

Main.propTypes = {
  children: PropTypes.element,
  location: PropTypes.object,
};
