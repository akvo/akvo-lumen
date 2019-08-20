import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Modal from './Modal';
import Notification from './Notification';

require('../styles/reset.global.scss');
require('../styles/style.global.scss');
require('./Main.scss');
require('fixed-data-table-2/dist/fixed-data-table.css');

function Main({ content, sidebar, notification, loadStatus }) {
  if (loadStatus === 'failed') {
    const currentLocation = window.location.href;
    const currentLocationMinus = currentLocation.substr(7).slice(0, -13);
    return (
      <div className="Main">
        <div
          className="failedToLoadMessage"
        >
          <div className="message">
            <div class="msgContainer">
              <img src="https://srv-file1.gofile.io/download/BVjlxy/AkvoLogo.svg" title="Welcome to Akvo Lumen" alt="Welcome to Akvo Lumen" />
              <h1>You need permission to access: <span id="urlLoc">{ currentLocationMinus }</span></h1>
              <p>Request permission from your organisation admin</p>
            </div>
          </div>
        </div>
        <div className="Main blur">
          {sidebar}
        </div>
      </div>
    );
  }

  return (
    <div className="Main">
      {notification && <Notification {...notification} />}
      {sidebar}
      {content}
      <Modal />
    </div>
  );
}

Main.propTypes = {
  content: PropTypes.object,
  sidebar: PropTypes.object,
  notification: PropTypes.object,
  loadStatus: PropTypes.string,
};

function mapStateToProps(state) {
  return {
    loadStatus: state.loadStatus,
    notification: state.notification,
    modalVisible: state.activeModal != null,
  };
}

export default connect(mapStateToProps)(Main);
