import moment from 'moment';
import getVegaScatterSpec from './vega-specs/Scatter';
import getVegaPieSpec from './vega-specs/Pie';
import getVegaAreaSpec from './vega-specs/Area';
import getVegaBarSpec from './vega-specs/Bar';

const getFilterValues = (filters, row) => filters.map((filter) => {
  const value = row.get(filter.column);
  const columnType = filter.columnType;
  let filterValue;

  if (value === null) {
    filterValue = null;
  } else {
    switch (columnType) {
      case 'text':
        filterValue = value.toString();
        break;

      case 'number':
        filterValue = parseFloat(value) || null;
        break;
      case 'date':
        filterValue = parseFloat(value) * 1000 || null;
        break;

      default:
        throw new Error(`Unknown column type ${columnType} supplied to getFilterValues`);
    }
  }

  return filterValue;
});

export function getChartData(visualisation, datasets) {
  const { datasetId, spec } = visualisation;
  const filters = spec.filters;
  const dataset = datasets[datasetId];
  const vType = visualisation.visualisationType;
  const columnIndexX = spec.metricColumnX;
  const columnIndexY = spec.metricColumnY;
  const nameDataX = null;
  const nameDataXType = null;
  const aggregationValuesX = spec.bucketColumn != null ?
    dataset.get('rows').map(row => row.get(spec.bucketColumn)).toArray() : null;
  const dataX = dataset.get('rows').map(row => row.get(columnIndexX)).toArray();
  const dataXType = spec.metricColumnXType;
  const dataY = columnIndexY != null ?
    dataset.get('rows').map(row => row.get(columnIndexY)).toArray() : null;
  const dataYType = spec.metricColumnYType;
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
        const row = dataset.get('rows').get(index);

        /* filterValues is an array of cell values in the correct order to be tested by the array of
        /* filters for this visualisation. I.e. each value in this array is determined by the column
        /* specified in the filter at that index in the filter array. */
        const filterValues = getFilterValues(filters, row);

        let label = null;

        if (nameDataX) {
          if (vType === 'bar' || vType === 'pie' || vType === 'donut') {
            label = nameDataX[key];
            if (nameDataXType === 'date') {
              label = moment.unix(label).format('YYYY-MM-DD hh:mm');
            } else if (nameDataXType === 'number') {
              label = parseFloat(label);
            } else if (nameDataXType === 'text') {
              label = label.toString();
            }
          }
        }

        let aggregationValue = aggregationValuesX ? aggregationValuesX[index] : null;
        aggregationValue = spec.bucketColumnType === 'date' ?
          parseFloat(aggregationValue) * 1000 : aggregationValue;

        return ({
          index: key,
          y: parseFloat(entry),
          label,
          aggregationValue,
          filterValues,
        });
      });

      if (spec.sort !== null) {
        dataValues.sort((a, b) => {
          let returnValue;

          if (a.sortValue > b.sortValue) {
            returnValue = 1;
          } else if (b.sortValue > a.sortValue) {
            returnValue = -1;
          } else {
            returnValue = 0;
          }

          if (spec.reverseSortX) {
            returnValue *= -1;
          }

          return returnValue;
        });

        dataValues = dataValues.map((item, index) => {
          const newItem = Object.assign({}, item);

          newItem.x = index;
          return newItem;
        });
      }


      output = {
        values: dataValues,
      };

      break;

    case 'scatter':

      dataValues = dataX.map((entry, index) => {
        let label = nameDataX ? nameDataX[index] : null;
        label = nameDataXType === 'date' ? parseFloat(label) * 1000 : label;

        let aggregationValue = aggregationValuesX ? aggregationValuesX[index] : null;
        aggregationValue = spec.bucketColumnType === 'date' ?
          parseFloat(aggregationValue) * 1000 : aggregationValue;

        const row = dataset.get('rows').get(index);
        const filterValues = getFilterValues(filters, row);
        const x = dataXType === 'date' ? parseFloat(entry) * 1000 : parseFloat(entry);
        const y = dataYType === 'date' ? parseFloat(dataY[index]) * 1000 : parseFloat(dataY[index]);

        return ({
          x,
          y,
          label,
          aggregationValue,
          filterValues,
        });
      });

      output = {
        values: dataValues,
      };

      break;

    default:
      throw new Error('chart type not yet implemented');
  }

  const outputArray = [];

  if (spec.filters && spec.filters.length > 0) {
    const filterArray = [];

    output.name = 'source';
    outputArray.push(output);

    for (let i = 0; i < filters.length; i += 1) {
      const filter = filters[i];
      let comparitor;

      switch (filter.strategy) {
        case 'isHigher':
          if (filter.operation === 'remove') {
            comparitor = '<=';
          } else if (filter.operation === 'keep') {
            comparitor = '>';
          }
          break;

        case 'is':
          if (filter.operation === 'remove') {
            comparitor = '!==';
          } else if (filter.operation === 'keep') {
            comparitor = '===';
          }
          break;

        case 'isLower':
          if (filter.operation === 'remove') {
            comparitor = '>=';
          } else if (filter.operation === 'keep') {
            comparitor = '<';
          }
          break;

        case 'isEmpty':
          if (filter.operation === 'remove') {
            comparitor = '!=';
          } else if (filter.operation === 'keep') {
            comparitor = '===';
          }
          break;

        default:
          throw new Error(`Unknown filter strategy ${filter.strategy} supplied to getChartData`);
      }

      // Vega doesn't allow toString() so we have to use ugly type coercion
      const filterValue = filter.value;
      const adjustedFilterValue = filter.columnType === 'date' ?
        parseFloat(filterValue * 1000)
        :
        filterValue;
      const test = filter.columnType === 'text' ?
        `('' + datum.filterValues[${i}]) ${comparitor} "${filter.value}"`
        :
        `parseFloat(datum.filterValues[${i}]) ${comparitor} parseFloat(${adjustedFilterValue})`
      ;

      filterArray.push({
        type: 'filter',
        test,
      });
    }

    outputArray.push({
      name: 'table',
      source: 'source',
      transform: filterArray,
    });
  } else {
    output.name = 'table';
    outputArray.push(output);
  }

  return outputArray;
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
