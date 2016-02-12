import React, { Component, PropTypes } from 'react';
import DataFileFileSelection from './DataFileFileSelection';
import LinkDataSourceSettings from './LinkDataSourceSettings';

export default class FileSelection extends Component {

  renderFileSelection() {
    const { dataSource, onChange } = this.props;
    switch (dataSource.type) {
      case 'DATA_FILE':
        return (
          <DataFileFileSelection
            dataSource={dataSource}
            onChange={onChange}/>
        );
      case 'LINK':
        return (
          <LinkDataSourceSettings
            dataSource={dataSource}
            onChange={onChange}/>
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

FileSelection.propTypes = {
  dataSource: PropTypes.shape({
    type: PropTypes.oneOf(['DATA_FILE', 'LINK']).isRequired,
    // Other props are data source specific.
  }),
  onChange: PropTypes.func.isRequired,
};
