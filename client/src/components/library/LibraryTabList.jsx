import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

const tabs = [{
  label: <FormattedMessage id="all" />,
  tabname: 'all',
}, {
  label: <FormattedMessage id="dataset" />,
  tabname: 'datasets',
}, {
  label: <FormattedMessage id="visualisation" />,
  tabname: 'visualisations',
}, {
  label: <FormattedMessage id="dashboard" />,
  tabname: 'dashboards',
}];

export default function LibraryTabList(props) {
  return (
    <div className="LibraryTabList">
      <ul>
        {tabs.map(({ tabname, label }, index) =>
          <li
            key={index}
            onClick={() => props.onSelect(tabname)}
            className={`clickable  ${tabname === props.selected && 'selected'}`}
          >
            {label}
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
