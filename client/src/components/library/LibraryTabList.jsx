import React, { PropTypes } from 'react';

const capitalize = string => `${string[0].toUpperCase()}${string.slice(1)}`;
const tabs = ['all', 'datasets', 'visualisations', 'dashboards'];

export default function LibraryTabList(props) {
  return (
    <div className="LibraryTabList">
      <ul>
        {tabs.map((tabname, index) =>
          <li
            key={index}
            onClick={() => props.onSelect(tabname)}
            className={`clickable  ${tabname === props.selected && 'selected'}`}
          >
            {capitalize(tabname)}
          </li>
        )}
      </ul>
    </div>
  );
}

LibraryTabList.propTypes = {
  onSelect: PropTypes.func,
  selected: PropTypes.oneOf(['all', 'datasets', 'visualisations', 'dashboards']),
};
