import React, { Component, PropTypes } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { routeActions } from 'react-router-redux';
import SourceSelection from './createDataset/SourceSelection';
import FileSelection from './createDataset/FileSelection';
import Settings from './dataset/Settings';
import { createDataset } from '../actions/dataset';

class CreateDataset extends Component {

  constructor() {
    super();
    this.state = {
      currentPage: 'source',
      dataset: {
        name: '',
        source: {
          type: 'DATA_FILE',
        },
        columns: null,
      },
    };
  }

  pageComponent(page) {
    const { dataset } = this.state;
    switch (page) {
      case 'source':
        return (
          <SourceSelection
            dataSourceType={dataset.source.type}
            onChangeDataSourceType={newDataSourceType => (
              this.setState({
                dataset: { source: { type: newDataSourceType } },
              })
            )}
          />
      );
      case 'file':
        return (
          <FileSelection
            dataset={dataset}
            onChange={(newDataset) => {
              this.setState({ dataset: newDataset });
            }}
          />
      );
      case 'settings':
        return (
          <Settings
            dataset={dataset}
            onChange={(newDataset) => {
              this.setState({ dataset: newDataset });
            }}
          />
      );
      default: throw new Error(`Not yet implemented: ${page}`);
    }
  }

  handleNextOrImport() {
    const { dispatch } = this.props;
    const { currentPage, dataset } = this.state;
    if (currentPage === 'source') {
      this.setState({ currentPage: 'file' });
    } else if (currentPage === 'file') {
      this.setState({ currentPage: 'settings' });
    } else if (currentPage === 'settings') {
      dispatch(createDataset(dataset));
    }
  }

  handlePrevious() {
    const { currentPage } = this.state;
    if (currentPage === 'settings') {
      this.setState({ currentPage: 'file' });
    } else if (currentPage === 'file') {
      this.setState({ currentPage: 'source' });
    }
  }

  render() {
    const { dispatch } = this.props;
    const { currentPage } = this.state;
    return (
      <Modal isOpen>
        <span>New Dataset</span>
        <button onClick={() => dispatch(routeActions.goBack())}>
          X
        </button>
        <ul>
          <li className={currentPage === 'source' ? 'selected' : null}>Source</li>
          <li className={currentPage === 'file' ? 'selected' : null}>File / Project</li>
          <li className={currentPage === 'settings' ? 'selected' : null}>Settings</li>
        </ul>
        {this.pageComponent(currentPage)}
        <button
          disabled={currentPage === 'source'}
          onClick={this.handlePrevious.bind(this)}>
          Previous
        </button>
        <button
          onClick={this.handleNextOrImport.bind(this)}>
          {currentPage === 'settings' ? 'Import' : 'Next'}
        </button>
      </Modal>
    );
  }
}

CreateDataset.propTypes = {
  dispatch: PropTypes.func.isRequired,
};

function mapStateToProps() {
  return {};
}

export default connect(
  mapStateToProps
)(CreateDataset);
