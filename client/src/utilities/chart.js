export function getChartData(visualisation, datasets) {
  const { datasetId, spec } = visualisation;
  const dataset = datasets[datasetId];
  const columnIndexX = spec.datasetColumnX;
  const columnIndexY = spec.datasetColumnY;
  const nameDataX = spec.datasetNameColumnX != null ?
    dataset.rows.map(row => row[spec.datasetNameColumnX]) : null;
  const dataX = dataset.rows.map(row => row[columnIndexX]);
  const dataY = columnIndexY !== null ? dataset.rows.map(row => row[columnIndexY]) : null;
  let dataValues = [];
  let output = [];

  switch (visualisation.visualisationType) {
    case 'map':

      dataX.forEach((entry, index) => {
        const label = nameDataX ? nameDataX[index] : null;
        const newPositionObject = {
          position: [parseFloat(dataY[index]), parseFloat(dataX[index])],
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
          key = nameDataX[index];
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
        const key = nameDataX ? nameDataX[index] : index;

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
