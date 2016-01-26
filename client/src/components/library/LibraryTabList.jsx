import React, { Component, PropTypes } from 'react';

export default class LibraryTabList extends Component {
  render() {
    return (
      <div className="LibraryTabList">
        <ul>
          <li onClick={() => this.props.onSelect('datasets')}>Datasets</li>
          <li onClick={() => this.props.onSelect('visualisations')}>Visualisations</li>
          <li onClick={() => this.props.onSelect('dashboards')}>Dashboards</li>
        </ul>
      </div>
    );
  }
}

LibraryTabList.propTypes = {
  onSelect: PropTypes.func,
  selected: PropTypes.oneOf(['all', 'datasets', 'visualisations', 'dashboards']),
};
