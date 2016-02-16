import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Modal from 'react-modal';
import SourceSelection from './createDataset/SourceSelection';
import FileSelection from './createDataset/FileSelection';
import Settings from '../dataset/Settings';
import * as actionCreators from '../../actions/dataset';

require('../../styles/CreateDataset.scss');

class CreateDataset extends Component {

  constructor() {
    super();
    this.handleNextOrImport = this.handleNextOrImport.bind(this);
  }

  pageComponent(page) {
    const { currentPage, dataset } = this.props.imports;
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
          <FileSelection
            dataSource={dataset.source}
            onChange={this.props.defineDataSource}
          />
      );
      case 'define-dataset':
        return (
          <Settings
            dataset={dataset}
            onChangeName={this.props.defineDatasetSettings}
          />
      );
      default: throw new Error(`Not yet implemented: ${page}`);
    }
  }

  handleNextOrImport() {
    const { currentPage, dataset } = this.props.imports;
    if (currentPage === 'define-dataset') {
      this.props.createDataset(dataset);
    } else {
      this.props.nextPage();
    }
  }

  render() {
    const { onCancel, imports } = this.props;
    const { currentPage } = imports;

    return (
      <Modal
        isOpen
        style={{ overlay: { zIndex: 99 } }}>
        <div className="CreateDataset">
          <h3 className="modalTitle">New Dataset</h3>
          <button className="btn close clickable" onClick={onCancel}>
            X
          </button>
          <ul className="tabMenu">
            <li className={`tab ${currentPage === 'select-data-source-type' ? 'selected' : null}`}>
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
          <div className={`movementControls ${currentPage}`}>
            <div className="buttonContainer">
              <button
                className="btn previous clickable"
                disabled={currentPage === 'select-data-source-type'}
                onClick={this.props.previousPage}>
                Previous
              </button>
              <button
                className="btn next clickable"
                onClick={this.handleNextOrImport}>
                {currentPage === 'define-dataset' ? 'Import' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

CreateDataset.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  previousPage: PropTypes.func.isRequired,
  nextPage: PropTypes.func.isRequired,
  defineDatasetSettings: PropTypes.func.isRequired,
  defineDataSource: PropTypes.func.isRequired,
  selectDataSource: PropTypes.func.isRequired,
  createDataset: PropTypes.func.isRequired,
  imports: PropTypes.shape({
    currentPage: PropTypes.string.isRequired,
    dataset: PropTypes.object.isRequired, // TODO: shape?
  }),
  containerClassName: PropTypes.string,
};


function mapStateToProps(state, ownProps) {
  return {
    onSubmit: ownProps.onSubmit,
    onCancel: ownProps.onCancel,
    imports: state.library.imports,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actionCreators, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateDataset);
