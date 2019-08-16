import React from 'react';
import LocaleSelector from './LocaleSelector';
import * as auth from '../../../utilities/auth';

require('./UserMenuPopUp.scss');

const UserMenuPopUp = () =>
  <div className="UserMenuPopUp">
    <LocaleSelector />
    <hr />
    <button onClick={() => auth.logout()}>Logout</button>
  </div>;

export default UserMenuPopUp;
