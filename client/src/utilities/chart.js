import dl from 'datalib';
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

const getFilterArray = (spec) => {
  const filterArray = [];

  for (let i = 0; i < spec.filters.length; i += 1) {
    const filter = spec.filters[i];
    const testValue = filter.columnType === 'date' ? filter.value * 1000 : filter.value;

    switch (filter.strategy) {
      case 'isHigher':
        if (filter.operation === 'remove') {
          filterArray.push(d => d <= testValue);
        } else if (filter.operation === 'keep') {
          filterArray.push(d => d > testValue);
        }
        break;

      case 'is':
        if (filter.operation === 'remove') {
          filterArray.push(d => d !== testValue);
        } else if (filter.operation === 'keep') {
          filterArray.push(d => d === testValue);
        }
        break;

      case 'isLower':
        if (filter.operation === 'remove') {
          filterArray.push(d => d >= testValue);
        } else if (filter.operation === 'keep') {
          filterArray.push(d => d < testValue);
        }
        break;

      case 'isEmpty':
        if (filter.operation === 'remove') {
          filterArray.push(d => d !== null || d !== '');
        } else if (filter.operation === 'keep') {
          filterArray.push(d => d === testValue);
        }
        break;

      default:
        throw new Error(`Unknown filter strategy ${filter.strategy} supplied to getChartData`);
    }
  }
  return filterArray;
};

const applyBucketAggregation = (output, spec) => {
  const includeValues = spec.subBucketColumn !== null;
  const ops = includeValues ? [spec.metricAggregation, 'values'] : [spec.metricAggregation];
  const aggregatedOutput = {};

  const summarizeArray = [
    {
      name: 'y',
      ops,
    },
  ];

  // If X axis is also a metric axis, summarize that too
  if (spec.metricColumnX !== null) {
    summarizeArray.push({
      name: 'x',
      ops,
    });
  }

  const aggregatedDataValues = dl.groupby(['bucketValue'])
    .summarize(summarizeArray)
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
      const newSubBucket = Object.assign({}, subBucket);

      newSubBucket.parentMetric = parentMetric;
      newSubBucket.bucketValue = parentBucketValue;
      subBuckets.push(newSubBucket);
    });
  });

  return {
    values: subBuckets,
  };
};

const sortDataValues = (output, vType, spec) => {
  const isLineType = vType === 'line' || vType === 'area';
  const isLineAggregationType = (isLineType && spec.bucketColumn !== null);
  let sortField;

  if (isLineAggregationType) {
    sortField = 'bucketValue';
  } else if (isLineType) {
    sortField = 'x';
  } else {
    sortField = `${spec.metricAggregation}_y`;
  }

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

function getColumnIndex(dataset, columnName) {
  return dataset.get('columns').findIndex(column => column.get('columnName') === columnName);
}

function getColumnData(dataset, columnName) {
  if (columnName == null) {
    return null;
  }
  return dataset.get('rows').map(row => row.get(getColumnIndex(dataset, columnName))).toArray();
}

export function getMapData(visualisation, datasets) {
  const { datasetId, spec } = visualisation;
  const dataset = datasets[datasetId];

  const longitude = getColumnData(dataset, spec.longitude);
  const latitude = getColumnData(dataset, spec.latitude);
  const datapointLabelValueColumn = getColumnData(dataset, spec.datapointLabelColumn);
  const pointColorValueColumn = getColumnData(dataset, spec.pointColorColumn);

  const dataValues = [];
  const filterArray = (spec.filters && spec.filters.length > 0) ? getFilterArray(spec) : null;

  longitude.forEach((entry, index) => {
    const row = dataset.get('rows').get(index);

    let datapointLabelValue = datapointLabelValueColumn ? datapointLabelValueColumn[index] : null;

    datapointLabelValue = spec.datapointLabelValue === 'date' ?
      parseFloat(datapointLabelValue) * 1000 : datapointLabelValue;

    let pointColorValue = pointColorValueColumn ? pointColorValueColumn[index] : null;
    pointColorValue = spec.pointColorValueColumn === 'date' ?
      parseFloat(pointColorValue) * 1000 : pointColorValue;

    let pointColor;

    if (pointColorValue !== null) {
      pointColor = spec.pointColorMapping[pointColorValue];
    }

    const latitudeValue = latitude[index];

    /* We will not include this datapoint if a required value is missing, or it is filtered out */
    let includeDatapoint = true;

    if (entry === null) {
      includeDatapoint = false;
    }

    if (latitudeValue === null) {
      includeDatapoint = false;
    }

    /* filterValues is an array of cell values from the current row in the correct order to be
    /* tested by filterArray, an array of filter functions. */
    const filterValues = getFilterValues(spec.filters, row);

    if (includeDatapoint && filterArray) {
      for (let j = 0; j < filterArray.length; j += 1) {
        if (!filterArray[j](filterValues[j])) {
          includeDatapoint = false;
        }
      }
    }

    if (includeDatapoint) {
      dataValues.push({
        latitude: latitudeValue,
        longitude: entry,
        datapointLabelValue,
        pointColor,
      });
    }
  });

  return dataValues;
}

export function getChartData(visualisation, datasets) {
  const { datasetId, spec } = visualisation;
  const dataset = datasets[datasetId];
  const metricColumnY = dataset.get('rows').map(row => row.get(spec.metricColumnY)).toArray();
  const metricColumnX = spec.metricColumnX !== null ?
    dataset.get('rows').map(row => row.get(spec.metricColumnX)).toArray() : null;
  const vType = visualisation.visualisationType;
  const bucketValueColumn = spec.bucketColumn != null ?
    dataset.get('rows').map(row => row.get(spec.bucketColumn)).toArray() : null;
  const subBucketValueColumn = spec.subBucketColumn != null ?
    dataset.get('rows').map(row => row.get(spec.subBucketColumn)).toArray() : null;
  const datapointLabelValueColumn = spec.datapointLabelColumn != null ?
    dataset.get('rows').map(row => row.get(spec.datapointLabelColumn)).toArray() : null;
  const pointColorValueColumn = spec.pointColorColumn != null ?
    dataset.get('rows').map(row => row.get(spec.pointColorColumn)).toArray() : null;
  const dataValues = [];
  const filterArray = (spec.filters && spec.filters.length > 0) ? getFilterArray(spec) : null;
  let output = [];

  /* All visulations have a metricColumnY, so we use this column to iterate through the dataset
  /* row-by-row, collecting and computing the necessary values to build each datapoint for the
  /* chartData */
  metricColumnY.forEach((entry, index) => {
    const row = dataset.get('rows').get(index);

    let bucketValue = bucketValueColumn ? bucketValueColumn[index] : null;
    bucketValue = spec.bucketColumnType === 'date' ?
      parseFloat(bucketValue) * 1000 : bucketValue;

    let subBucketValue = subBucketValueColumn ? subBucketValueColumn[index] : null;
    subBucketValue = spec.bucketColumnType === 'date' ?
      parseFloat(subBucketValue) * 1000 : subBucketValue;

    let datapointLabelValue = datapointLabelValueColumn ? datapointLabelValueColumn[index] : null;
    datapointLabelValue = spec.bucketColumnType === 'date' ?
      parseFloat(datapointLabelValue) * 1000 : datapointLabelValue;

    let pointColorValue = pointColorValueColumn ? pointColorValueColumn[index] : null;
    pointColorValue = spec.bucketColumnType === 'date' ?
      parseFloat(pointColorValue) * 1000 : pointColorValue;

    let pointColor;

    if (vType === 'map' && pointColorValue !== null) {
      pointColor = spec.pointColorMapping[pointColorValue];
    }

    let x = null; // Not all datapoints will have an 'x' value - sometimes we use the index instead

    if (metricColumnX !== null) {
      x = metricColumnX[index];

      if (spec.metricColumnXType === 'date') {
        x *= 1000;
      }
    }

    /* We will not include this datapoint if a required value is missing, or it is filtered out */
    let includeDatapoint = true;

    if (entry === null) {
      includeDatapoint = false;
    }

    if ((vType === 'area' && spec.metricColumnX !== null) ||
      (vType === 'line' && spec.metricColumnX !== null) ||
      vType === 'scatter' || vType === 'map') {
      if (x === null) {
        includeDatapoint = false;
      }
    }

    /* filterValues is an array of cell values from the current row in the correct order to be
    /* tested by filterArray, an array of filter functions. */
    const filterValues = getFilterValues(spec.filters, row);

    if (includeDatapoint && filterArray) {
      for (let j = 0; j < filterArray.length; j += 1) {
        if (!filterArray[j](filterValues[j])) {
          includeDatapoint = false;
        }
      }
    }

    if (includeDatapoint) {
      dataValues.push({
        index,
        x,
        y: parseFloat(entry),
        bucketValue,
        subBucketValue,
        datapointLabelValue,
        pointColor,
      });
    }
  });

  output = {
    values: dataValues, // A raw array of all datapoints included datapoints, before aggregations
  };

  if (spec.bucketColumn !== null) {
    output = applyBucketAggregation(output, spec);
  }

  /* Sort the aggregated values if a sort is defined by the user, or if a sort is necessary to show
  /* a coherent chart, based on the spec */
  if (spec.sort ||
    (vType === 'area' && spec.metricColumnX !== null) ||
    (vType === 'line' && spec.metricColumnX !== null)) {
    output = sortDataValues(output, vType, spec);
  }

  const shouldTruncateValues = vType === 'bar' && spec.truncateSize !== null;

  if (shouldTruncateValues) {
    const limit = parseInt(spec.truncateSize, 10);

    output.values = output.values.slice(0, limit);
  }

  /* Only apply the sub-bucket aggregations after we have sorted and truncated based on the
  /* bucket values */

  if (vType === 'bar' && spec.subBucketColumn !== null) {
    output = applySubBucketAggregation(output, spec);
  }

  if (vType === 'bar' && spec.subBucketMethod === 'stack') {
    const max = Math.max(...output.values.map(item => item.parentMetric));

    output.metadata = output.metadata || {};
    output.metadata.max = max;
  }

  output.name = 'table';

  const chartData = [output];

  return chartData;
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
