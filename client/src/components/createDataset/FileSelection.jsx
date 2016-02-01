import React, { Component, PropTypes } from 'react';
import DataFileFileSelection from './DataFileFileSelection';
import LinkFileSelection from './LinkFileSelection';
import NotImplementedFileSelection from './NotImplementedFileSelection';

export default class FileSelection extends Component {

  renderFileSelection() {
    const { dataset, onChange } = this.props;
    switch (dataset.source.type) {
      case 'DATA_FILE':
        return (
          <DataFileFileSelection
            dataset={dataset}
            onChange={onChange}/>
        );
      case 'LINK':
        return (
          <LinkFileSelection
            dataset={dataset}
            onChange={onChange}/>
        );
      default:
        return <NotImplementedFileSelection/>;
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
  dataset: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
