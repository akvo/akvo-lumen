import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

function Tab({ tabname, isSelected, onSelect }) {
  return (
    <li
      onClick={() => onSelect(tabname)}
      className={`clickable  ${isSelected && 'selected'}`}
    >
      <FormattedMessage id={tabname} />
    </li>
  );
}

Tab.propTypes = {
  tabname: PropTypes.string.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};

const tabs = ['all', 'datasets', 'visualisations', 'dashboards'];

export default function LibraryTabList(props) {
  return (
    <div className="LibraryTabList">
      <ul>
        {tabs.map(tabname =>
          <Tab
            key={tabname}
            tabname={tabname}
            isSelected={props.selected === tabname}
            onSelect={props.onSelect}
          />
        )}
      </ul>
    </div>
  );
}

LibraryTabList.propTypes = {
  onSelect: PropTypes.func,
  selected: PropTypes.oneOf(tabs),
};
