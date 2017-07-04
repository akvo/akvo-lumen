import React from 'react';
import PropTypes from 'prop-types';

const options = [
  { value: 'dataset', label: 'Dataset' },
  { value: 'visualisation', label: 'Visualisation' },
  { value: 'dashboard', label: 'Dashboard' },
];

export default function LibraryCreateButton({ onCreate }) {
  return (
    <div className="LibraryCreateButton">
      {options.map((option, idx) =>
        <button
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
