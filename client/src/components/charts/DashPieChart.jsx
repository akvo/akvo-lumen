import React, { Component, PropTypes } from 'react';
import { PieChart } from 'react-d3';

const getChartData = (visualisation, datasets) => {
  const datasetID = visualisation.sourceDatasetX;
  const dataset = datasets[datasetID];
  const columnIndex = visualisation.datasetColumnX;
  const data = dataset.columns[columnIndex].values;
  const dataValues = [];

  data.map((entry, index) => {
    dataValues.push({
      label: index,
      value: parseInt(entry, 10),
    });
  });

  return dataValues;
};

export default class DashPieChart extends Component {
  render() {
    const chartData = getChartData(this.props.visualisation, this.props.datasets);
    const visualisation = this.props.visualisation;
    const innerRadius = visualisation.visualisationType === 'donut' ? 20 : null;

    return (
      <div className="DashPieChart dashChart">
        <PieChart
          title={visualisation.title}
          height={400}
          width={400}
          radius={100}
          innerRadius={innerRadius}
          data={chartData}
          sectorBorderColor="white"
          />
      </div>
    );
  }
}

DashPieChart.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};
