import React, { Component, PropTypes } from 'react';
import { ScatterChart } from 'react-d3';

const getChartData = (visualisation, datasets) => {
  const datasetIDX = visualisation.sourceDatasetX;
  const datasetIDY = visualisation.sourceDatasetY;
  const datasetX = datasets[datasetIDX];
  const datasetY = datasets[datasetIDY];
  const columnIndexX = visualisation.datasetColumnX;
  const columnIndexY = visualisation.datasetColumnY;
  const dataX = datasetX.columns[columnIndexX].values;
  const dataY = datasetY.columns[columnIndexY].values;
  const dataValues = [];
  const output = [];

  dataX.map((entry, index) => {
    dataValues.push({
      x: parseInt(entry, 10),
      y: parseInt(dataY[index], 10),
    });
  });

  output.push({
    name: 'series1',
    values: dataValues,
  });

  return output;
};

export default class DashScatterChart extends Component {
  render() {
    const barData = getChartData(this.props.visualisation, this.props.datasets);
    const visualisation = this.props.visualisation;
    const yDomain = visualisation.rangeY || null;
    const gridHorizontal = true;
    const gridVertical = true;

    return (
      <div className="DashScatterChart dashChart">
        <ScatterChart
          title={visualisation.name}
          height={400}
          width={800}
          data={barData}
          yDomain={yDomain || [0, 100]}
          gridHorizontal={gridHorizontal}
          gridVertical={gridVertical}
          xAxisLabel={visualisation.labelX || ''}
          yAxisLabel={visualisation.labelY || ''}
          />
      </div>
    );
  }
}

DashScatterChart.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};
