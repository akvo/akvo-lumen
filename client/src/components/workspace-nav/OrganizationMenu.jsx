import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { setLanguage } from '../../actions/translations';

function OrganizationMenu({ profile, dispatch }) {
  return (
    <div className="OrganizationMenu">
      <div className="name"><i className="fa fa-user-o" aria-hidden="true" /> {profile.username}
      </div>
      <div>
        <button
          onClick={() => dispatch(setLanguage('en'))}
        >
          en
        </button>
        {' '}
        <button
          onClick={() => dispatch(setLanguage('fr'))}
        >
          fr
        </button>
      </div>
      <div className="organization">Akvo Lumen</div>
    </div>
  );
}

OrganizationMenu.propTypes = {
  dispatch: PropTypes.func.isRequired,
  profile: PropTypes.shape({
    username: PropTypes.string,
  }).isRequired,
};

export default connect(() => ({}))(OrganizationMenu);
