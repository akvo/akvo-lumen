import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { every } from 'lodash';
import { FormattedMessage } from 'react-intl';
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
    const q = new URLSearchParams(this.props.location.search);
    const showEditUser = q.get('edit_user') !== 'false';
    const {
      dispatch,
      profile: { firstName, lastName },
    } = this.props;
    if (showEditUser
        && (!every([firstName, lastName], Boolean))) {
      console.log(showEditUser, q.get('edit_user'));
      dispatch(showModal('edit-user'));
    }
  }
  render() {
    const {
      content, sidebar, notification, loadStatus, env,
    } = this.props;
    if (loadStatus === 'failed') {
      const { tenant } = env;
      return (
        <div className="Main">
          <div className="failedToLoadMessage">
            <div className="message">
              <div className="msgContainer">
                <img src={IMAGES.BRAND.logo} title="Welcome to Akvo Lumen" alt="Welcome to Akvo Lumen" />
                <h1>
                  <FormattedMessage id="you_need_permission_to_access" />: <span id="urlLoc">{ tenant }</span>
                </h1>
                <p>
                  <FormattedMessage id="request_permission_from_your_organisation_admin" /> <button type="button" onClick={() => auth.logout()}><FormattedMessage id="logout" /></button> <FormattedMessage id="to_try_with_another_account" />.
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
  location: PropTypes.object,
  notification: PropTypes.object,
  loadStatus: PropTypes.string,
  env: PropTypes.object,
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
