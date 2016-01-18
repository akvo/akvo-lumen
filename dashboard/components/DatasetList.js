import React, { Component, PropTypes } from 'react';
import DatasetGraph from './DatasetGraph';
import DatasetItem from './DatasetItem';

export default class DatasetList extends Component {
  render() {
    return (
      <div>
        <h2>{this.printTitle()}</h2>
      	{
      		this.props.datasets.dataSets.map((set, index) => 
      			this.printSetIfHasName(set, index)
      			 
      	)}
      </div>
    )
  }

  printSetIfHasName(set, index) {
    if (set.name) {
      return <DatasetItem
      datasetId={index}
      set={set}
      key={index}
      visualisations={this.props.visualisations}
      saveVisualisation={this.props.saveVisualisation}
      activeVisualisationModal={this.props.visualisations.activeVisualisationModal}
      toggleVisualisationModal={this.props.toggleVisualisationModal}
      datasets={this.props.datasets}
      />
    }
  }

  printTitle() {
    const namedDatasets = this.props.datasets.dataSets.filter(entry => {if (entry.name) return entry});
    if (namedDatasets.length > 0) {
      return namedDatasets.length + ' stored datasets';
    } else {
      return 'No datasets stored yet'
    }
  }
}