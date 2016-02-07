import React, { Component, PropTypes } from 'react';
import { LineChart } from 'react-d3';

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

export default class DashLineChart extends Component {
  render() {
    const chartData = getChartData(this.props.visualisation, this.props.datasets);
    const visualisation = this.props.visualisation;
    const gridHorizontal = true;
    const gridVertical = true;

    return (
      <div className="DashLineChart dashChart">
        <LineChart
          title={visualisation.title}
          height={400}
          width={800}
          data={chartData}
          yDomain={[0, 100]}
          gridHorizontal={gridHorizontal}
          gridVertical={gridVertical}
          xAxisLabel={visualisation.labelX || ''}
          yAxisLabel={visualisation.labelY || ''}
          />
      </div>
    );
  }
}

DashLineChart.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};
