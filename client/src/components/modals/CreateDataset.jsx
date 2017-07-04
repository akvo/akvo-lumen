import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ModalHeader from './ModalHeader';
import ModalFooter from './ModalFooter';
import SourceSelection from './createDataset/SourceSelection';
import DataSourceSettings from './createDataset/DataSourceSettings';
import Settings from '../dataset/Settings';
import * as actionCreators from '../../actions/dataset';

require('./CreateDataset.scss');

class CreateDataset extends Component {

  constructor() {
    super();
    this.handleNextOrImport = this.handleNextOrImport.bind(this);
    this.isValidImport = this.isValidImport.bind(this);
  }

  pageComponent(page) {
    const { currentPage, dataset } = this.props.datasetImport;
    switch (currentPage) {
      case 'select-data-source-type':
        return (
          <SourceSelection
            dataSourceKind={dataset.source.kind}
            onChangeDataSource={this.props.selectDataSource}
          />
        );
      case 'define-data-source':
        return (
          <DataSourceSettings
            dataSource={dataset.source}
            onChange={this.props.defineDataSource}
            onChangeSettings={this.props.defineDatasetSettings}
            updateUploadStatus={this.props.updateDatasetUploadStatus}
          />
        );
      case 'define-dataset':
        return (
          <Settings
            dataset={dataset}
            onChangeSettings={this.props.defineDatasetSettings}
          />
        );
      default: throw new Error(`Not yet implemented: ${page}`);
    }
  }

  handleNextOrImport() {
    const { currentPage, dataset } = this.props.datasetImport;
    if (currentPage === 'define-dataset') {
      this.props.importDataset(dataset);
      this.props.clearImport();
    } else {
      this.props.nextPage();
    }
  }

  isValidImport() {
    const dataset = this.props.datasetImport.dataset;
    return DataSourceSettings.isValidSource(dataset.source) && dataset.name !== '';
  }

  render() {
    const { onCancel, datasetImport, clearImport } = this.props;
    const { currentPage, uploadRunning } = datasetImport;

    return (
      <div className="CreateDataset">
        <ModalHeader
          title="New Dataset"
          onCloseModal={() => {
            clearImport();
            onCancel();
          }}
        />
        <div className="ModalContents">
          <ul className="tabMenu">
            <li
              className={`tab ${currentPage === 'select-data-source-type' ? 'selected' : null}`}
            >
              Source
            </li>
            <li className={`tab ${currentPage === 'define-data-source' ? 'selected' : null}`}>
              File / Project
            </li>
            <li className={`tab ${currentPage === 'define-dataset' ? 'selected' : null}`}>
              Settings
            </li>
          </ul>
          {this.pageComponent(currentPage)}
        </div>
        <ModalFooter
          leftButton={{
            text: 'Previous',
            disabled: currentPage === 'select-data-source-type' || uploadRunning,
            onClick: this.props.previousPage,
          }}
          rightButton={{
            text: currentPage === 'define-dataset' ? 'Import' : 'Next',
            className: 'btn next clickable positive',
            disabled: currentPage === 'define-dataset' ? !this.isValidImport() : false
                || uploadRunning,
            onClick: this.handleNextOrImport,
          }}
        />
      </div>
    );
  }
}

CreateDataset.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  previousPage: PropTypes.func.isRequired,
  nextPage: PropTypes.func.isRequired,
  updateDatasetUploadStatus: PropTypes.func.isRequired,
  defineDatasetSettings: PropTypes.func.isRequired,
  defineDataSource: PropTypes.func.isRequired,
  selectDataSource: PropTypes.func.isRequired,
  importDataset: PropTypes.func.isRequired,
  clearImport: PropTypes.func.isRequired,
  datasetImport: PropTypes.shape({
    currentPage: PropTypes.string.isRequired,
    dataset: PropTypes.object.isRequired, // TODO: shape?
  }),
  containerClassName: PropTypes.string,
};


function mapStateToProps(state, ownProps) {
  return {
    onSubmit: ownProps.onSubmit,
    onCancel: ownProps.onCancel,
    datasetImport: state.library.datasetImport,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actionCreators, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateDataset);
