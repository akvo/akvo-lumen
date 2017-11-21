import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DataFileDataSourceSettings, { isValidSource as isValidFileSource } from './DataFileDataSourceSettings';
import LinkDataSourceSettings, { isValidSource as isValidLinkSource } from './LinkDataSourceSettings';
import AkvoFlowDataSourceSettings, { isValidSource as isValidFlowSource } from './AkvoFlowDataSourceSettings';
import GeoTIFFDataSourceSettings, { isValidSource as isValidGeoTIFFSource } from './GeoTIFFDataSourceSettings';

export default class DataSourceSettings extends Component {

  static isValidSource(dataSource) {
    switch (dataSource.kind) {
      case 'DATA_FILE': return isValidFileSource(dataSource);
      case 'LINK': return isValidLinkSource(dataSource);
      case 'AKVO_FLOW': return isValidFlowSource(dataSource);
      case 'GEOTIFF': return isValidGeoTIFFSource(dataSource);
      default: throw new Error(`Unknown data source kind: ${dataSource.kind}`);
    }
  }

  renderFileSelection() {
    const { dataSource, onChange, onChangeSettings, updateUploadStatus } = this.props;
    switch (dataSource.kind) {
      case 'DATA_FILE':
        return (
          <DataFileDataSourceSettings
            dataSource={dataSource}
            onChange={onChange}
            updateUploadStatus={updateUploadStatus}
          />
        );
      case 'LINK':
        return (
          <LinkDataSourceSettings
            dataSource={dataSource}
            onChange={onChange}
          />
        );
      case 'AKVO_FLOW':
        return (
          <AkvoFlowDataSourceSettings
            dataSource={dataSource}
            onChange={onChange}
            onChangeSettings={onChangeSettings}
          />
        );
      case 'GEOTIFF':
        return (
          <GeoTIFFDataSourceSettings
            dataSource={dataSource}
            onChange={onChange}
            updateUploadStatus={updateUploadStatus}
          />
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
    kind: PropTypes.oneOf(['DATA_FILE', 'LINK', 'AKVO_FLOW', 'GEOTIFF']).isRequired,
    // Other props are data source specific.
  }),
  onChange: PropTypes.func.isRequired,
  onChangeSettings: PropTypes.func.isRequired,
  updateUploadStatus: PropTypes.func.isRequired,
};
