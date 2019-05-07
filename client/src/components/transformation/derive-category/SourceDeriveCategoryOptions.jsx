import React from 'react';
import PropTypes from 'prop-types';

export default function SourceDeriveCategoryOptions({ dataset, onChange }) {
  return (
    <div className="SourceDeriveCategoryOptions">
      Select source column
      <ul>
        {dataset.columns && dataset.columns.map(({ columnName, title, type }) => (
          <li key={columnName}>
            <a onClick={() => onChange(columnName)}>
              <span className="SourceDeriveCategoryOptions__title">{title}</span>
              <span className="SourceDeriveCategoryOptions__type">{type}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

SourceDeriveCategoryOptions.propTypes = {
  dataset: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
