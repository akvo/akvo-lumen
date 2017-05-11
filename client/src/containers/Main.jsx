import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import DashboardModal from '../components/DashboardModal';
import Notification from './Notification';

require('../styles/reset.global.scss');
require('../styles/style.global.scss');
require('../styles/Main.scss');
require('fixed-data-table/dist/fixed-data-table.css');


function Main({ content, sidebar, notification }) {
  return (
    <div className="Main">
      {notification && <Notification {...notification} />}
      {sidebar}
      {content}
      <DashboardModal />
    </div>
  );
}

Main.propTypes = {
  content: PropTypes.object,
  sidebar: PropTypes.object,
  notification: PropTypes.object,
};

function mapStateToProps(state) {
  return {
    notification: state.notification,
  };
}

export default connect(mapStateToProps)(Main);
