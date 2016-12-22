import moment from 'moment';
import getVegaScatterSpec from './vega-specs/Scatter';
import getVegaPieSpec from './vega-specs/Pie';
import getVegaAreaSpec from './vega-specs/Area';
import getVegaBarSpec from './vega-specs/Bar';

const dl = require('datalib');

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
  const dataset = datasets[datasetId];
  const metricColumnY = dataset.get('rows').map(row => row.get(spec.metricColumnY)).toArray();
  const metricColumnX = spec.metricColumnX !== null ?
    dataset.get('rows').map(row => row.get(spec.metricColumnX)).toArray() : null;
  const vType = visualisation.visualisationType;
  const columnIndexX = spec.metricColumnX;
  const columnIndexY = spec.metricColumnY;

  const bucketValues = spec.bucketColumn != null ?
    dataset.get('rows').map(row => row.get(spec.bucketColumn)).toArray() : null;

  const subBucketValues = spec.subBucketColumn != null ?
    dataset.get('rows').map(row => row.get(spec.subBucketColumn)).toArray() : null;

  const dataX = dataset.get('rows').map(row => row.get(columnIndexX)).toArray();
  const dataXType = spec.metricColumnXType;

  const dataYType = spec.metricColumnYType;
  let dataValues = [];
  let output = [];

  /* All visulations have a metricColumnY - only some also have a metricColumnX. So iterate over metricColumnY to process the data */
  metricColumnY.forEach((entry, index) => {
    const row = dataset.get('rows').get(index);

    /* filterValues is an array of cell values in the correct order to be tested by the array of
    /* filters for this visualisation. I.e. each value in this array is determined by the column
    /* specified in the filter at that index in the filter array. */
    const filterValues = getFilterValues(spec.filters, row);

    let bucketValue = bucketValues ? bucketValues[index] : null;
    bucketValue = spec.bucketColumnType === 'date' ?
      parseFloat(bucketValue) * 1000 : bucketValue;

    let subBucketValue = subBucketValues ? subBucketValues[index] : null;
    subBucketValue = spec.bucketColumnType === 'date' ?
      parseFloat(subBucketValue) * 1000 : subBucketValue;

    let x;

    if (metricColumnX !== null) {
      x = metricColumnX[index];

      if (spec.metricColumnXType === 'date') {
        x *= 1000;
      }
    }

    /* Only include datapoint if all required row values are present */
    let includeDatapoint = true;

    if (entry === null) {
      includeDatapoint = false;
    }

    if ((vType === 'area' && spec.metricColumnX !== null) || (vType === 'line' && spec.metricColumnX !== null) || vType === 'scatter') {
      if (x === null) {
        includeDatapoint = false;
      }
    }

    if (includeDatapoint) {
      dataValues.push({
        index,
        x,
        y: parseFloat(entry),
        bucketValue,
        subBucketValue,
        filterValues,
      });
    }
  });

  if (spec.bucketColumn !== null) {
    dataValues = applyAggregations(dataValues, spec);
  }

  if (spec.sort || (vType === 'area' && spec.metricColumnX !== null) || (vType === 'line' && spec.metricColumnX !== null)) {
    dataValues = sortDataValues(dataValues, spec);
  }

  output = {
    values: dataValues,
  };

  if (vType === 'bar' && spec.subBucketMethod === 'stack') {
    /* Vega will only have access to the subBucket values and not their totals for each bucket.
    /* Because we are stacking the subBuckets, we need to add the total for each bucket so we can
    /* set the Y-axis max to the correct value */
    const max = getRangeMax(dataValues, spec);

    output.metadata = {
      max,
    }
  }
  /*

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

    default:
      throw new Error('chart type not yet implemented');
  }

  */

  const outputArray = [];

  if (spec.filters && spec.filters.length > 0) {
    const filterArray = [];

    output.name = 'source';
    outputArray.push(output);

    for (let i = 0; i < spec.filters.length; i += 1) {
      const filter = spec.filters[i];
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

const sortDataValues = (dataValues, spec) => {
  let sortField;

  if (spec.sort === null) {
    sortField = 'x';
  } else {
    sortField = `${spec.metricAggregation}_y`;
  }

  let out =  dataValues.sort((a, b) => {
    let returnValue;

    if (a[sortField] > b[sortField]) {
      returnValue = 1;
    } else if (b[sortField] > a[sortField]) {
      returnValue = -1;
    } else {
      returnValue = 0;
    }

    if (spec.sort === 'dsc') {
      // reverse the sort
      returnValue *= -1;
    }

    return returnValue;
  });

  console.log(out);

  return out;
}

const applyAggregations = (dataValues, spec) => {
  let out;

  if (spec.bucketColumn !== null && spec.subBucketColumn === null) {
    out = dl.groupby(['bucketValue'])
      .summarize(
        [
          {
            name: 'y',
            ops: [spec.metricAggregation],
          },
        ]
      )
      .execute(dataValues);
  } else if (spec.bucketColumn !== null && spec.subBucketColumn !== null) {
    /*
    out = dl.groupby(['bucketValue', 'subBucketValue'])
      .summarize(
        [
          {
            name: 'y',
            ops: [spec.metricAggregation],
          },
        ]
      )
      .execute(dataValues);
    */
    out = dl.groupby(['bucketValue'])
      .summarize([
      {
        name: 'y',
        ops: [spec.metricAggregation, 'values'],
      }
      ]).execute(dataValues);

    out.forEach((item) => {
      item.subBucket = dl.groupby(['subBucketValue']).summarize([{name: 'foobar', ops: ['count']}]).execute(item.values_y);
    });

    console.log(out);
  } else {
    out = dataValues;
  }

  return out;
}

const getRangeMax = (dataValues, spec) => {

  /* This function can probably be sped up significantly, but given that it's operating on
  /* aggregated data, it probably doesn't matter */
  let bucketTotals = {};

  dataValues.forEach((item) => {
    bucketTotals[item.bucketValue] = bucketTotals[item.bucketValue] || 0;
    bucketTotals[item.bucketValue] += item[`${spec.metricAggregation}_y`];
  })

  let max = 0;

  Object.keys(bucketTotals).forEach((key) => {
    max = bucketTotals[key] > max ? bucketTotals[key] : max;
  });

  return max;
}