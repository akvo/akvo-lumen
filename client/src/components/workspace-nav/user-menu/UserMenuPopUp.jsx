import React from 'react';
import PropTypes from 'prop-types';
import * as auth from '../../../utilities/auth';

require('./UserMenuPopUp.scss');

const availableLocales = [{
  label: 'English',
  tag: 'en',
}, {
  label: 'Espanol',
  tag: 'es',
}, {
  label: 'Francais',
  tag: 'fr',
}];

/*
  - Select users locale from profile
  - Persist new locale, where?
    - auth0 profile
    - cookie?
  - Fix prop types
*/
const Locale = ({ locale, setLocale }) => {
  if (locale.tag === 'en') {
    return (
      <label htmlFor="option-{locale.tag}" className="btn btn-secondary active">
        <input
          type="radio"
          name="options"
          id="option1-{locale.tag}"
          value={locale.tag}
          autoComplete="off"
          onChange={setLocale}
          defaultChecked
        />
        {locale.label}
      </label>
    );
  }
  return (
    <label htmlFor="option-{locale.tag}" className="btn btn-secondary active">
      <input
        type="radio"
        name="options"
        id="option-{locale.tag}"
        value={locale.tag}
        autoComplete="off"
        onChange={setLocale}
      />
      {locale.label}
    </label>
  );
};

Locale.propTypes = {
  locale: PropTypes.object,
  setLocale: PropTypes.func.isRequired,
};

class LocaleSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = { locale: 'en' };
    this.setLocale = this.setLocale.bind(this);
  }

  setLocale(e) {
    const newLocale = e.currentTarget.value;
    console.log('newLocale:');
    console.log(newLocale);
    this.setState({
      locale: newLocale,
    });
  }

  render() {
    return (
      <div>
        <b>Language</b>
        <div className="btn-group btn-group-toggle" data-toggle="buttons">
          {availableLocales.map(locale => (
            <Locale key={locale.tag} locale={locale} setLocale={this.setLocale} />
          ))
          }
        </div>
      </div>
    );
  }
}

const UserMenuPopUp = ({ profile }) => {
  return (
    <div className="UserMenuPopUp">
      <LocaleSelector profile={profile} />
      <hr />
      <a onClick={() => auth.logout()}>Logout</a>
    </div>
  );
};

UserMenuPopUp.propTypes = {
  profile: PropTypes.object,
};

export default UserMenuPopUp;
