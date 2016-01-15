import React, { Component, PropTypes } from 'react';
import DatasetGraph from './DatasetGraph';
import VisualisationItem from './VisualisationItem';

export default class VisualisationList extends Component {
  render() {
    return (
      <div>
      	{
      		this.props.visualisations.all.map((item, index) => 
      			<VisualisationItem
              key={index}
              visualisation={item}
              datasets={this.props.datasets}
              visualisationSize={this.props.visualisationSize}
            />
      	)}
      </div>
    )
  }
}
