import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import WorkspaceNav from '../components/WorkspaceNav';
import Modal from './Modal';
import Notification from './Notification';

require('../styles/reset.global.scss');
require('../styles/style.global.scss');
require('./Main.scss');
require('fixed-data-table-2/dist/fixed-data-table.css');

function Main({ location, children, notification }) {
  return (
    <div className="Main">
      {notification && <Notification {...notification} />}
      <WorkspaceNav
        location={location}
      />
      {children}
      <Modal />
    </div>
  );
}

Main.propTypes = {
  children: PropTypes.element,
  location: PropTypes.object,
  notification: PropTypes.object,
};

function mapStateToProps(state) {
  return {
    notification: state.notification,
  };
}

export default connect(mapStateToProps)(Main);
