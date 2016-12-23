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

const getFilterArray = (spec) => {
  const filterArray = [];

  for (let i = 0; i < spec.filters.length; i += 1) {
    const filter = spec.filters[i];
    const testValue = filter.columnType === 'date' ? filter.value * 1000 : filter.value;

    switch (filter.strategy) {
      case 'isHigher':
        if (filter.operation === 'remove') {
          filterArray.push((d) => d <= testValue);
        } else if (filter.operation === 'keep') {
          filterArray.push((d) => d > testValue);
        }
        break;

      case 'is':
        if (filter.operation === 'remove') {
          filterArray.push((d) => d !== testValue);
        } else if (filter.operation === 'keep') {
          filterArray.push((d) => d === testValue);
        }
        break;

      case 'isLower':
        if (filter.operation === 'remove') {
          filterArray.push((d) => d >= testValue);
        } else if (filter.operation === 'keep') {
          filterArray.push((d) => d < testValue);
        }
        break;

      case 'isEmpty':
        if (filter.operation === 'remove') {
          filterArray.push((d) => d != testValue);
        } else if (filter.operation === 'keep') {
          filterArray.push((d) => d === testValue);
        }
        break;

      default:
        throw new Error(`Unknown filter strategy ${filter.strategy} supplied to getChartData`);
    }
  }
  return filterArray;
}

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
  const dataValues = [];
  let output = [];

  let _filters;

  if (spec.filters && spec.filters.length > 0) {
    _filters = getFilterArray(spec);
  }

  /* All visulations have a metricColumnY - only some also have a metricColumnX. So iterate over metricColumnY to process the data */
  metricColumnY.forEach((entry, index) => {
    const row = dataset.get('rows').get(index);

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

    /* Only include datapoint if all required row values are present, and it is not filtered out*/
    let includeDatapoint = true;

    if (entry === null) {
      includeDatapoint = false;
    }

    /* filterValues is an array of cell values in the correct order to be tested by the array of
    /* filters for this visualisation. I.e. each value in this array is determined by the column
    /* specified in the filter at that index in the filter array. */
    const filterValues = getFilterValues(spec.filters, row);

    if (includeDatapoint && _filters) {
      for (let y = 0; y < _filters.length; y++) {
        if (!_filters[y](filterValues[y])) {
          includeDatapoint = false;
        }
      }
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

  output = {
    values: dataValues,
  };

  if (spec.bucketColumn !== null) {
    output = applyBucketAggregation(output, spec);
  }

  if (spec.sort || (vType === 'area' && spec.metricColumnX !== null) || (vType === 'line' && spec.metricColumnX !== null)) {
    output = sortDataValues(output, spec);
  }

  const shouldTruncateValues = vType === 'bar' && spec.truncateSize !== null;

  if (shouldTruncateValues) {
    const limit = parseInt(spec.truncateSize);

    output.values = output.values.slice(0, limit);
  }

  // Only apply the sub-bucket aggregations after we have sorted and truncated based on the bucket values

  if (spec.subBucketColumn !== null) {
    output = applySubBucketAggregation(output, spec);
  }

  if (vType === 'bar' && spec.subBucketMethod === 'stack') {
    const max = getRangeMax(output.values, spec);

    output.metadata = output.metadata || {};
    output.metadata.max = max;
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

  output.name = 'table';
  outputArray.push(output);

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

const sortDataValues = (output, spec) => {
  const sortField = `${spec.metricAggregation}_y`;

  output.values.sort((a, b) => {
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

  return output;
};

const applyBucketAggregation = (output, spec) => {
  const includeValues = spec.subBucketColumn !== null;
  const ops = includeValues ? [spec.metricAggregation, 'values'] : [spec.metricAggregation];
  const aggregatedOutput = {};
  let aggregatedDataValues;

  aggregatedDataValues = dl.groupby(['bucketValue'])
    .summarize(
      [
        {
          name: 'y',
          ops,
        },
      ]
    )
    .execute(output.values);

  aggregatedOutput.values = aggregatedDataValues;

  return aggregatedOutput;
};

const applySubBucketAggregation = (output, spec) => {
  const buckets = output.values;
  const subBuckets = [];

  buckets.forEach((bucket) => {
    const parentMetric = bucket[`${spec.metricAggregation}_y`];
    const parentBucketValue = bucket.bucketValue;

    const parentSubBuckets = dl.groupby(['subBucketValue'])
      .summarize([{
        name: 'y',
        ops: [spec.metricAggregation],
        as: [`${spec.metricAggregation}_y`],
      }])
      .execute(bucket.values_y);

    parentSubBuckets.forEach((subBucket) => {
      subBucket.parentMetric = parentMetric;
      subBucket.bucketValue = parentBucketValue;
      subBuckets.push(subBucket);
    });
  });


  return {
    values: subBuckets,
  };
};

const getRangeMax = (values, spec) => {
  let max = 0;

  values.forEach((item) => {
    max = item.parentMetric > max ? item.parentMetric : max;
  });

  return max;
};
