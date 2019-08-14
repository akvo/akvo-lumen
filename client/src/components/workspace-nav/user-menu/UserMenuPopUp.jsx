import React from 'react';
import PropTypes from 'prop-types';
import LocaleSelector from './LocaleSelector';
import * as auth from '../../../utilities/auth';

require('./UserMenuPopUp.scss');

const UserMenuPopUp = ({ profile }) =>
  <div className="UserMenuPopUp">
    <LocaleSelector profile={profile} />
    <hr />
    <a onClick={() => auth.logout()}>Logout</a>
  </div>;

UserMenuPopUp.propTypes = {
  profile: PropTypes.object,
};

export default UserMenuPopUp;
