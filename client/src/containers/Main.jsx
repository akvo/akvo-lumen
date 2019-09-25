import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { every } from 'lodash';
import Modal from './Modal';
import { showModal } from '../actions/activeModal';
import Notification from './Notification';
import IMAGES from '../constants/images';
import * as auth from '../utilities/auth';

require('../styles/reset.global.scss');
require('../styles/style.global.scss');
require('./Main.scss');
require('fixed-data-table-2/dist/fixed-data-table.css');

class Main extends Component {
  componentDidMount() {
    const {
      dispatch,
      profile: { firstName, lastName },
      location: { pathname },
    } = this.props;
    if ((pathname.split('/').pop() !== 'export')
      && (!every([firstName, lastName], Boolean))) {
      dispatch(showModal('edit-user'));
    }
  }
  render() {
    const {
      content, sidebar, notification, loadStatus, env,
    } = this.props;
    if (loadStatus === 'failed') {
      const { authURL, tenant } = env;
      const isAuth0 = (authURL && authURL.includes('auth0'));
      if (isAuth0) {
        return (
          <div className="Main">
            <div className="failedToLoadMessage">
              <div className="message">
                <div className="msgContainer">
                  <img src={IMAGES.BRAND.logo} title="Welcome to Akvo Lumen" alt="Welcome to Akvo Lumen" />
                  <h1>You need permission to access: <span id="urlLoc">{ tenant }</span></h1>
                  <p>
                    Request permission from your organisation admin or <button type="button" onClick={() => auth.logout()}>logout</button> and try with another account.
                  </p>
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
          <div className="failedToLoadMessage">
            <div className="message">
              <div className="msgContainer">
                <img src={IMAGES.BRAND.logo} title="Welcome to Akvo Lumen" alt="Welcome to Akvo Lumen" />
                <h1>You need permission to access: <span id="urlLoc">{ tenant }</span></h1>
                <p>
                  Request permission from your organisation admin.
                </p>
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
}

Main.propTypes = {
  content: PropTypes.object,
  sidebar: PropTypes.object,
  notification: PropTypes.object,
  loadStatus: PropTypes.string,
  env: PropTypes.object,
  location: PropTypes.object,
  dispatch: PropTypes.func.isRequired,
  profile: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
  }).isRequired,
};

function mapStateToProps(state) {
  return {
    loadStatus: state.loadStatus,
    notification: state.notification,
    modalVisible: state.activeModal != null,
    env: state.env,
    profile: state.profile,
  };
}

export default connect(mapStateToProps)(Main);
