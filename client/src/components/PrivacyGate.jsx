import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import ErrorScreen from './common/ErrorScreen';

export default function PrivacyGate({ fetchData, hasSubmitted }) {
  const passwordInput = useRef();

  useEffect(() => {
    passwordInput.current.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const password = e.target.password.value;

    fetchData(password);
  };

  return (
    <ErrorScreen
      code={403}
      codeVisible={false}
      title="A password is required to view this visualisation/dashboard"
    >
      <form onSubmit={handleSubmit}>
        {hasSubmitted && <div className="alert alert-danger">Password incorrect</div>}
        <div className="clearfix" />

        <input ref={passwordInput} id="password" type="password" placeholder="Password" />

        <button type="submit" className="submitButton">Submit</button>
      </form>
    </ErrorScreen>
  );
}

PrivacyGate.propTypes = {
  fetchData: PropTypes.func,
  hasSubmitted: PropTypes.bool,
};
