export function getChartData(visualisation, datasets) {
  const datasetID = visualisation.sourceDataset;
  const dataset = datasets[datasetID];
  const columnIndexX = visualisation.datasetColumnX;
  const columnIndexY = visualisation.datasetColumnY;
  const nameDataX = dataset.columns[visualisation.datasetNameColumnX];
  const dataX = dataset.columns[columnIndexX].values;
  const dataY = columnIndexY !== null ? dataset.columns[columnIndexY].values : null;
  let dataValues = [];
  let output = [];

  switch (visualisation.visualisationType) {
    case 'map':

      dataX.forEach((entry, index) => {
        const label = nameDataX ? nameDataX.values[index] : null;
        const newPositionObject = {
          position: [parseFloat(dataX[index]), parseFloat(dataY[index])],
          label,
        };

        if (!isNaN(newPositionObject.position[0])
            && !isNaN(newPositionObject.position[1])) {
          dataValues.push(newPositionObject);
        }
      });

      output.push({
        values: dataValues,
      });
      break;

    case 'bar':
    case 'line':
    case 'area':

      dataValues = dataX.map((entry, index) => {
        let key = index;

        if (nameDataX && visualisation.visualisationType === 'bar') {
          key = nameDataX.values[index];
        }

        return ({
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


      output = dataX.map((entry, index) => {
        const key = nameDataX ? nameDataX.values[index] : index;

        return ({
          label: key,
          value: parseInt(entry, 10),
        });
      });

      break;

    case 'scatter':

      dataValues = dataX.map((entry, index) => {
        const item = {
          x: parseInt(entry, 10),
          y: parseInt(dataY[index], 10),
        };

        return item;
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
