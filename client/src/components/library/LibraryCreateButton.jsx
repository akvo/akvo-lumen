import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

const options = [
  { value: 'dataset', label: <FormattedMessage id="dataset" /> },
  { value: 'visualisation', label: <FormattedMessage id="visualisation" /> },
  { value: 'dashboard', label: <FormattedMessage id="dashboard" /> },
];

export default function LibraryCreateButton({ onCreate }) {
  return (
    <div className="LibraryCreateButton">
      {options.map((option, idx) =>
        <button
          data-test-id={option.value}
          className="clickable"
          key={idx}
          onClick={() => onCreate(option.value)}
        >
          + {option.label}
        </button>
      )}
    </div>
  );
}

LibraryCreateButton.propTypes = {
  onCreate: PropTypes.func.isRequired,
};
