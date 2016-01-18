import React, { Component, PropTypes } from 'react';
import DatasetGraph from './DatasetGraph';

export default class VisualisationItem extends Component {
  render() {
    return (
      <div style={{
        display: 'inline-block',
        backgroundColor: 'whitesmoke',
        margin: '20px'
      }}>
        <h3 style={{
          textAlign: 'center'
        }}>{this.props.visualisation.name}</h3>
        <h5 style={{
          textAlign: 'center'
        }}>Parent dataset: {this.props.datasets.dataSets[this.props.visualisation.datasetId].name}</h5>
        <DatasetGraph
          datasetId={this.props.visualisation.datasetId}
          datasets={this.props.datasets}
              graphWidth={this.props.visualisationSize || 250}
              graphHeight={this.props.visualisationSize || 250}
              labelOffset={-5}
              labelDirection="default"
              type={this.props.visualisation.type}
        />        
      </div>
    )
  }
}