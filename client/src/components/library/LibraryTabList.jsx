import React, { Component, PropTypes } from 'react';

export default class LibraryTabList extends Component {
  render() {
    return (
      <div>
        <ul>
          <li onClick={() => this.props.onSelect('DATASETS')}>Datasets</li>
          <li onClick={() => this.props.onSelect('VISUALISATIONS')}>Visualisations</li>
          <li onClick={() => this.props.onSelect('DASHBOARDS')}>Dashboards</li>
        </ul>
      </div>
    );
  }
}

LibraryTabList.propTypes = {
  onSelect: PropTypes.func,
  selected: PropTypes.oneOf(['ALL', 'DATASETS', 'VISUALISATIONS', 'DASHBOARDS']),
};
