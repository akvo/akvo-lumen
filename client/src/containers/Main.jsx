import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import WorkspaceNav from '../components/WorkspaceNav';
import DashboardModal from '../components/DashboardModal';
import Notification from '../components/Notification';
import { hideNotification } from '../actions/notification';

require('../styles/reset.global.scss');
require('../styles/style.global.scss');
require('../styles/Main.scss');
require('fixed-data-table/dist/fixed-data-table.css');

export function Main({ location, children, notification, dispatch }) {
  return (
    <div className="Main">
      {notification &&
        <Notification
          {...notification}
          onDismiss={() => dispatch(hideNotification())}
        />
      }
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
  notification: PropTypes.object,
  dispatch: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  return {
    notification: state.notification,
  };
}

export default connect(mapStateToProps)(Main);
