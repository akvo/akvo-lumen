import React from 'react';
import LocaleSelector from './LocaleSelector';
import * as auth from '../../../utilities/auth';

require('./UserMenuPopUp.scss');

const UserMenuPopUp = () =>
  <div className="UserMenuPopUp">
    <LocaleSelector />
    <hr />
    <a onClick={() => auth.logout()}>Logout</a>
  </div>;

export default UserMenuPopUp;
