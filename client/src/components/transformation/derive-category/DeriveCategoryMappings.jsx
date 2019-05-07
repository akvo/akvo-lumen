import React from 'react';
import PropTypes from 'prop-types';

export default function DeriveCategoryMappings({ dataset, onChange }) {
  return (
    <div className="DeriveCategoryMappings">
      Mappings
      {/* <ul>
        {dataset.columns && dataset.columns.map(({ columnName, title, type }) => (
          <li key={columnName}>
            <a onClick={() => onChange(columnName)}>
              <span className="DeriveCategoryMappings__title">{title}</span>
              <span className="DeriveCategoryMappings__type">{type}</span>
            </a>
          </li>
        ))}
      </ul> */}
    </div>
  );
}

DeriveCategoryMappings.propTypes = {
  dataset: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
