import React, { Component, PropTypes } from 'react';
import DataFileDataSourceSettings from './DataFileDataSourceSettings';
import LinkDataSourceSettings from './LinkDataSourceSettings';

export default class DataSourceSettings extends Component {

  static isValidSource(dataSource) {
    switch (dataSource.kind) {
      case 'DATA_FILE': return DataFileDataSourceSettings.isValidSource(dataSource);
      case 'LINK': return LinkDataSourceSettings.isValidSource(dataSource);
      default: throw new Error(`Unknown data source kind: ${dataSource.kind}`);
    }
  }

  renderFileSelection() {
    const { dataSource, onChange } = this.props;
    switch (dataSource.kind) {
      case 'DATA_FILE':
        return (
          <DataFileDataSourceSettings
            dataSource={dataSource}
            onChange={onChange} />
        );
      case 'LINK':
        return (
          <LinkDataSourceSettings
            dataSource={dataSource}
            onChange={onChange} />
        );
      default:
        throw new Error(`Data source definition for ${dataSource.type} is not yet implemented`);
    }
  }

  render() {
    return (
      <div className="FileSelection">
        <div className="contents">
          {this.renderFileSelection()}
        </div>
      </div>
    );
  }
}

DataSourceSettings.propTypes = {
  dataSource: PropTypes.shape({
    kind: PropTypes.oneOf(['DATA_FILE', 'LINK']).isRequired,
    // Other props are data source specific.
  }),
  onChange: PropTypes.func.isRequired,
};
