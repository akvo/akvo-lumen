import React, { Component, PropTypes } from 'react';

export default class LibraryTabList extends Component {
  capitalize(string) {
    return string[0].toUpperCase() + string.slice(1);
  }
  render() {
    const tabs = ['all', 'datasets', 'visualisations', 'dashboards'];
    return (
      <div className="LibraryTabList">
        <ul>
          {tabs.map((tabname, index) =>
            <li
              key={index}
              onClick={() => this.props.onSelect(tabname)}
              className={`clickable  ${tabname === this.props.selected && 'selected'}`}
            >
              {this.capitalize(tabname)}
            </li>
          )}
        </ul>
      </div>
    );
  }
}

LibraryTabList.propTypes = {
  onSelect: PropTypes.func,
  selected: PropTypes.oneOf(['all', 'datasets', 'visualisations', 'dashboards']),
};
