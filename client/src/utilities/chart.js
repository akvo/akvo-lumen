export function getChartData(visualisation, datasets) {
  const datasetIDX = visualisation.sourceDatasetX;
  const datasetIDY = visualisation.sourceDatasetY;
  const datasetX = datasets[datasetIDX];
  const datasetY = datasets[datasetIDY];
  const columnIndexX = visualisation.datasetColumnX;
  const columnIndexY = visualisation.datasetColumnY;
  const nameDataX = datasetX.columns[visualisation.datasetNameColumnX];
  const dataX = datasetX.columns[columnIndexX].values;
  const dataY = datasetY ? datasetY.columns[columnIndexY].values : null;
  const dataValues = [];
  let output = [];

  switch (visualisation.visualisationType) {
    case 'bar':
    case 'line':
    case 'area':

      dataX.forEach((entry, index) => {
        let key = index;

        if (nameDataX && visualisation.visualisationType === 'bar') {
          key = nameDataX.values[index];
        }

        dataValues.push({
          x: key,
          y: parseInt(entry, 10),
        });
      });

      output.push({
        name: 'series1',
        values: dataValues,
      });
      break;

    case 'pie':
    case 'donut':

      dataX.forEach((entry, index) => {
        const key = nameDataX ? nameDataX.values[index] : index;

        dataValues.push({
          label: key,
          value: parseInt(entry, 10),
        });
      });

      output = dataValues;
      break;

    case 'scatter':

      dataX.forEach((entry, index) => {
        dataValues.push({
          x: parseInt(entry, 10),
          y: parseInt(dataY[index], 10),
        });
      });

      output.push({
        name: 'series1',
        values: dataValues,
      });
      break;

    default:
      throw new Error('chart type not yet implemented');
  }

  return output;
}
