import React, { Component, PropTypes } from 'react';
import ChartistGraph from 'react-chartist';

export default class DatasetGraph extends Component {
  render() {
    let data = this.props.datasets.dataSets[this.props.datasetId];
    data = data.hits;
    
    let filteredData = {};

    // Grab the data we need for the chart from state
    for (var entry in data.hits) {
      if (data.hits.hasOwnProperty(entry)) {
        var entry = data.hits[entry];
        if (entry._type === 'answer') {
          filteredData[entry._source.value] = filteredData[entry._source.value] || {};

          filteredData[entry._source.value].value = filteredData[entry._source.value].value + 1 || 1;

          filteredData[entry._source.value].label = filteredData[entry._source.value].label || entry._source.value;
        }
      }
    }

    let type = this.props.type;

    let graphData = {
      labels: [],
      series: []
    };

    let options = {};

    if (type === 'Pie' || type === 'Donut') {
      for (var entry in filteredData) {
        if (filteredData.hasOwnProperty(entry)) {
          entry = filteredData[entry];
          graphData.labels.push(entry.label);
          graphData.series.push(entry.value);
        }
      }

      options = {
        distributeSeries: true,
        donut: type === 'Donut',
        width: this.props.graphWidth || 500,
        height: this.props.graphHeight || 500,
        chartPadding: this.props.graphWidth / 8 || 100,
        labelOffset: this.props.labelOffset || this.props.graphWidth / 10 || 50,
        labelDirection: this.props.labelDirection || 'explode',
        chartMargin: 200
      };   

      type = 'Pie';

    } else if (type === 'Bar') {
      // Initialize with an empty array
      graphData.series.push([]);

      for (var entry in filteredData) {
        if (filteredData.hasOwnProperty(entry)) {
          entry = filteredData[entry];
          graphData.labels.push(entry.label);
          graphData.series[0].push(entry.value);
        }
      }      

      options = {
        width: this.props.graphWidth || 500,
        height: this.props.graphHeight || 500
      }
    }   

    if (type === 'Bar') {
      return (
        <div>
          <span className="forceRender">
            <ChartistGraph data={graphData} options={options} type='Bar' />
          </span>
        </div>
      )      
    } else {
      return (
        <div>
          <ChartistGraph data={graphData} options={options} type={type}/>
        </div>
      )
    }
  }
}