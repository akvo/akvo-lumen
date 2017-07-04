import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Modal from './Modal';
import Notification from './Notification';

require('../styles/reset.global.scss');
require('../styles/style.global.scss');
require('./Main.scss');
require('fixed-data-table-2/dist/fixed-data-table.css');


function Main({ content, sidebar, notification }) {
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
};

function mapStateToProps(state) {
  return {
    notification: state.notification,
  };
}

export default connect(mapStateToProps)(Main);
