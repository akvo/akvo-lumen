import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Modal from './Modal';
import Notification from './Notification';
import IMAGES from '../constants/images';

require('../styles/reset.global.scss');
require('../styles/style.global.scss');
require('./Main.scss');
require('fixed-data-table-2/dist/fixed-data-table.css');

function Main({ content, sidebar, notification, loadStatus, env }) {
  if (loadStatus === 'failed') {
    const { tenant } = env;
    return (
      <div className="Main">
        <div className="failedToLoadMessage">
          <div className="message">
            <div className="msgContainer">
              <img src={IMAGES.BRAND.logo} title="Welcome to Akvo Lumen" alt="Welcome to Akvo Lumen" />
              <h1>You need permission to access: <span id="urlLoc">{ tenant }</span></h1>
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
  env: PropTypes.object,
};

function mapStateToProps(state) {
  return {
    loadStatus: state.loadStatus,
    notification: state.notification,
    modalVisible: state.activeModal != null,
    env: state.env,
  };
}

export default connect(mapStateToProps)(Main);
