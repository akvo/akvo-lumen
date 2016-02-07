import React, { Component, PropTypes } from 'react';
import { BarChart } from 'react-d3';

const getChartData = (visualisation, datasets) => {
  const datasetID = visualisation.sourceDatasetX;
  const dataset = datasets[datasetID];
  const columnIndex = visualisation.datasetColumnX;
  const data = dataset.columns[columnIndex].values;
  const dataValues = [];
  const output = [];

  data.map((entry, index) => {
    dataValues.push({
      x: index,
      y: parseInt(entry, 10),
    });
  });

  output.push({
    name: 'series1',
    values: dataValues,
  });

  return output;
};

export default class DashBarChart extends Component {
  render() {
    const chartData = getChartData(this.props.visualisation, this.props.datasets);
    const visualisation = this.props.visualisation;

    return (
      <div className="DashBarChart dashChart">
        <BarChart
          title={visualisation.name}
          width={600}
          height={400}
          data={chartData}
          xAxisLabel={visualisation.labelX || ''}
          yAxisLabel={visualisation.labelY || ''}
        />
      </div>
    );
  }
}

DashBarChart.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};
