import React from 'react';
import { Component } from 'react';
import { connect } from 'react-redux';
import DatasetHeader from '../components/dataset/DatasetHeader';
import DatasetTable from '../components/dataset/DatasetTable';

class Dataset extends Component {

  componentDidMount() {
    // Fetch data if not available
  }

  render() {
    const { dataset } = this.props;
    return (
      <div className="Dataset">
        <DatasetHeader name={dataset.name}/>
        {dataset.columns ?
          <DatasetTable columns={dataset.columns}/> :
          <div>loading...</div>}
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const datasetId = ownProps.params.datasetId;
  const dataset = state.library.datasets[datasetId];
  return {
    dataset,
  }
}


export default connect(mapStateToProps)(Dataset);
