import React from 'react';
import PropTypes from 'prop-types';

import ConfigMenuSectionOption from './ConfigMenuSectionOption';
import './ConfigMenuSectionOptionThumbs.scss';

const ConfigMenuSectionOptionThumbs = ({ items, labelTextId }) => (
  <ConfigMenuSectionOption
    labelTextId={labelTextId}
  >
    {items.map(({ imageSrc, label, selected, onClick }) => (
      <a
        className={
          `ConfigMenuSectionOptionThumb ${selected ? 'ConfigMenuSectionOptionThumb--selected' : ''}`
        }
        onClick={onClick}
        key={label}
      >
        <img src={imageSrc} alt={label} />
        <h4>{label}</h4>
      </a>
    ))}
  </ConfigMenuSectionOption>
);

ConfigMenuSectionOptionThumbs.propTypes = {
  items: PropTypes.array.isRequired,
  labelTextId: PropTypes.string,
};

export default ConfigMenuSectionOptionThumbs;
