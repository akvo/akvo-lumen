import getVegaScatterSpec from './vega-specs/Scatter';
import getVegaPieSpec from './vega-specs/Pie';
import getVegaAreaSpec from './vega-specs/Area';
import getVegaBarSpec from './vega-specs/Bar';

export function getChartData(visualisation, datasets) {
  const { datasetId, spec } = visualisation;
  const dataset = datasets[datasetId];
  const vType = visualisation.visualisationType;
  const columnIndexX = spec.datasetColumnX;
  const columnIndexY = spec.datasetColumnY;
  const nameDataX = spec.datasetNameColumnX != null ?
    dataset.get('rows').map(row => row.get(spec.datasetNameColumnX)).toArray() : null;
  const aggregationValuesX = spec.datasetGroupColumnX != null ?
    dataset.get('rows').map(row => row.get(spec.datasetGroupColumnX)).toArray() : null;
  const dataX = dataset.get('rows').map(row => row.get(columnIndexX)).toArray();
  const dataY = columnIndexY != null ?
    dataset.get('rows').map(row => row.get(columnIndexY)).toArray() : null;
  let dataValues = [];
  let output = [];

  switch (vType) {
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
    case 'pie':
    case 'donut':

      dataValues = dataX.map((entry, index) => {
        const key = index;
        let label;
        let aggregationValue;

        if (nameDataX) {
          if (vType === 'bar' || vType === 'pie' || vType === 'donut') {
            label = nameDataX[key];
          }
        }
        if (aggregationValuesX) {
          aggregationValue = aggregationValuesX[key] ? aggregationValuesX[key].toString() : null;
        }

        return ({
          x: key,
          y: parseFloat(entry),
          label,
          aggregationValue,
        });
      });

      output = {
        name: 'table',
        values: dataValues,
      };

      break;

    case 'scatter':

      dataValues = dataX.map((entry, index) => {
        const label = nameDataX ? nameDataX[index] : null;
        const aggregationValue = aggregationValuesX ? aggregationValuesX[index] : null;

        return ({
          x: parseFloat(entry),
          y: parseFloat(dataY[index]),
          label,
          aggregationValue,
        });
      });

      output = {
        name: 'table',
        values: dataValues,
      };

      break;

    default:
      throw new Error('chart type not yet implemented');
  }
  return output;
}

export function getVegaSpec(visualisation, data, containerHeight, containerWidth) {
  const { visualisationType, name } = visualisation;
  let vspec;

  switch (visualisationType) {
    case 'bar':
      vspec = getVegaBarSpec(visualisation, data, containerHeight, containerWidth);
      break;

    case 'area':
    case 'line':
      vspec = getVegaAreaSpec(visualisation, data, containerHeight, containerWidth);
      break;

    case 'pie':
    case 'donut':
      vspec = getVegaPieSpec(visualisation, data, containerHeight, containerWidth);
      break;

    case 'scatter':
      vspec = getVegaScatterSpec(visualisation, data, containerHeight, containerWidth);
      break;

    default:
      throw new Error(`Unknown chart type ${visualisationType} supplied to getVegaSpec()`);
  }

  /* Set the properties common to all visualisation types */
  vspec.marks.push({
    type: 'text',
    name: 'title',
    properties: {
      enter: {
        x: {
          signal: 'width',
          mult: 0.5,
        },
        y: {
          value: -10,
        },
        text: {
          value: name,
        },
        fill: {
          value: 'black',
        },
        fontSize: {
          value: 16,
        },
        align: {
          value: 'center',
        },
        fontWeight: {
          value: 'bold',
        },
      },
    },
  });

  return vspec;
}
