import dl from 'datalib';
import getVegaScatterSpec from './vega-specs/Scatter';
import getVegaPieSpec from './vega-specs/Pie';
import getVegaAreaSpec from './vega-specs/Area';
import getVegaBarSpec from './vega-specs/Bar';

const getFilterArray = (filters, columns) => {
  const filterArray = [];

  for (let i = 0; i < filters.length; i += 1) {
    const filter = filters[i];
    const testValue = filter.value;
    const columnIndex = columns.findIndex(col => col.get('columnName') === filter.column);

    switch (filter.strategy) {
      case 'isHigher':
        if (filter.operation === 'remove') {
          filterArray.push(row => row.get(columnIndex) <= testValue);
        } else if (filter.operation === 'keep') {
          filterArray.push(row => row.get(columnIndex) > testValue);
        }
        break;

      case 'is':
        if (filter.operation === 'remove') {
          filterArray.push(row => row.get(columnIndex) !== testValue);
        } else if (filter.operation === 'keep') {
          filterArray.push(row => row.get(columnIndex) === testValue);
        }
        break;

      case 'isLower':
        if (filter.operation === 'remove') {
          filterArray.push(row => row.get(columnIndex) >= testValue);
        } else if (filter.operation === 'keep') {
          filterArray.push(row => row.get(columnIndex) < testValue);
        }
        break;

      case 'isEmpty':
        if (filter.operation === 'remove') {
          filterArray.push(row => row.get(columnIndex) !== null && row.get(columnIndex) !== '');
        } else if (filter.operation === 'keep') {
          filterArray.push(row => row.get(columnIndex) === null || row.get(columnIndex) === '');
        }
        break;

      default:
        throw new Error(`Unknown filter strategy ${filter.strategy} supplied to getFilterArray`);
    }
  }
  return filterArray;
};

function getColumnIndex(dataset, columnName) {
  return dataset.get('columns').findIndex(column => column.get('columnName') === columnName);
}

function filterFn(filters, columns) {
  const filterFns = getFilterArray(filters, columns);
  return row => filterFns.every(fn => fn(row));
}

export function getLineData(visualisation, datasets) {
  const { datasetId, spec } = visualisation;
  const dataset = datasets[datasetId];
  const haveAggregation = visualisation.spec.metricAggregation != null;
  const yIndex = getColumnIndex(dataset, spec.metricColumnY);
  const xIndex = getColumnIndex(dataset, spec.metricColumnX);
  const xAxisType = xIndex === -1 ? 'number' : dataset.get('columns').get(xIndex).get('type');
  const rowFilter = filterFn(spec.filters, dataset.get('columns'));

  const valueArray = dataset.get('rows')
    .filter(row => rowFilter(row))
    .map((row, index) => {
      const x = spec.metricColumnX === null ? index : row.get(xIndex);

      return ({
        x,
        y: row.get(yIndex),
      });
    })
    .toArray()
    .sort((a, b) => a.x - b.x);

  let aggregatedValues;

  if (haveAggregation) {
    aggregatedValues = dl.groupby(['x'])
      .summarize([{
        name: 'y',
        ops: [spec.metricAggregation],
        as: ['y'],
      }])
      .execute(valueArray);
  }

  return [{
    name: 'table',
    values: haveAggregation ? aggregatedValues : valueArray,
    metadata: {
      xAxisType,
    },
  }];
}

export function getScatterData(visualisation, datasets) {
  const { datasetId, spec } = visualisation;
  const dataset = datasets[datasetId];
  const haveAggregation = visualisation.spec.bucketColumn != null;
  const yIndex = getColumnIndex(dataset, spec.metricColumnY);
  const yAxisType = yIndex === -1 ? 'number' : dataset.get('columns').get(yIndex).get('type');
  const xIndex = getColumnIndex(dataset, spec.metricColumnX);
  const xAxisType = xIndex === -1 ? 'number' : dataset.get('columns').get(xIndex).get('type');
  const bucketIndex = getColumnIndex(dataset, spec.bucketColumn);
  const bucketType = bucketIndex === -1 ?
    'number' : dataset.get('columns').get(bucketIndex).get('type');
  const datapointLabelIndex = getColumnIndex(dataset, spec.datapointLabelColumn);
  const datapointLabelType = datapointLabelIndex === -1 ?
    'number' : dataset.get('columns').get(datapointLabelIndex).get('type');
  const rowFilter = filterFn(spec.filters, dataset.get('columns'));

  const valueArray = dataset.get('rows')
    .filter(row => rowFilter(row))
    .map(row => ({
      x: row.get(xIndex),
      y: row.get(yIndex),
      bucketValue: bucketIndex === -1 ? null : row.get(bucketIndex),
      datapointLabel: datapointLabelIndex === -1 ? null : row.get(datapointLabelIndex),
    }))
    .toArray();

  let aggregatedValues;

  if (haveAggregation) {
    aggregatedValues = dl.groupby(['bucketValue'])
      .summarize([
        {
          name: 'x',
          ops: [spec.metricAggregation],
          as: ['x'],
        },
        {
          name: 'y',
          ops: [spec.metricAggregation],
          as: ['y'],
        },
      ])
      .execute(valueArray);
  }

  return [{
    name: 'table',
    values: haveAggregation ? aggregatedValues : valueArray,
    metadata: {
      xAxisType,
      yAxisType,
      bucketType,
      datapointLabelType,
    },
  }];
}

export function getPieData(visualisation, datasets) {
  const { datasetId, spec } = visualisation;
  const dataset = datasets[datasetId];
  const bucketIndex = getColumnIndex(dataset, spec.bucketColumn);
  const rowFilter = filterFn(spec.filters, dataset.get('columns'));

  const valueArray = dataset.get('rows')
    .filter(row => rowFilter(row))
    .map(row => ({
      bucketValue: row.get(bucketIndex),
    }))
    .toArray();

  const aggregatedValues = dl.groupby(['bucketValue'])
    .summarize([{
      name: 'bucketValue',
      ops: ['count'],
      as: ['bucketCount'],
    }])
    .execute(valueArray);

  return [{
    name: 'table',
    values: aggregatedValues,
  }];
}

const defaultColor = '#000';

// Assume all 'equals' for now
function colorMappingFn(pointColorMapping) {
  return (value) => {
    const idx = pointColorMapping.findIndex(mappingEntry => mappingEntry.value === value);
    return idx < 0 ? defaultColor : pointColorMapping[idx].color;
  };
}

// Get the unique point color values out of the dataset
export function getPointColorValues(dataset, columnName, filters) {
  const pointColorIndex = getColumnIndex(dataset, columnName);
  const rowFilter = filterFn(filters, dataset.get('columns'));
  return dataset.get('rows')
    .filter(rowFilter)
    .map(row => row.get(pointColorIndex))
    .toSet()
    .toArray();
}

export function getMapData(layer, datasets) {
  const { datasetId } = layer;
  const dataset = datasets[datasetId];

  if (!dataset.get('columns')) {
    return null;
  }

  const longitudeIndex = getColumnIndex(dataset, layer.longitude);
  const latitudeIndex = getColumnIndex(dataset, layer.latitude);
  const pointColorIndex = getColumnIndex(dataset, layer.pointColorColumn);
  const colorMapper = colorMappingFn(layer.pointColorMapping);
  const popupIndexes = layer.popup.map(obj => getColumnIndex(dataset, obj.column));
  const rowFilter = filterFn(layer.filters, dataset.get('columns'));
  const filteredPointColorMapping = {};

  let maxLat = -90;
  let minLat = 90;
  let maxLong = -180;
  let minLong = 180;

  const values = dataset.get('rows')
    .filter(row => rowFilter(row))
    .map((row) => {
      const lat = row.get(latitudeIndex);
      const long = row.get(longitudeIndex);

      if (lat !== null && long !== null) {
        maxLat = Math.max(lat, maxLat);
        minLat = Math.min(lat, minLat);
        maxLong = Math.max(long, maxLong);
        minLong = Math.min(long, minLong);
      }

      const pointColorValue = row.get(pointColorIndex);
      const pointColor = pointColorIndex < 0 ? defaultColor : colorMapper(pointColorValue);

      if (pointColor !== defaultColor) {
        filteredPointColorMapping[pointColorValue] = pointColor;
      }

      return ({
        latitude: lat,
        longitude: long,
        pointColor,
        popup: popupIndexes.map(idx => ({
          title: dataset.getIn(['columns', idx, 'title']),
          value: dataset.getIn(['columns', idx, 'type']) === 'date' ?
            new Date(row.get(idx)).toString()
            :
            row.get(idx),
        })),
      });
    })
    .filter(({ latitude, longitude }) =>
      latitude != null && longitude != null
    )
    .toArray();

  return ({
    values,
    metadata: {
      bounds: [
        [minLat, minLong],
        [maxLat, maxLong],
      ],
      pointColorMapping: filteredPointColorMapping,
      pointColorColumnType: pointColorIndex > -1 ?
        dataset.get('columns').get(pointColorIndex).get('type') : null,
    },
  });
}

export function getBarData(visualisation, datasets) {
  const { datasetId, spec } = visualisation;
  const dataset = datasets[datasetId];
  const yIndex = getColumnIndex(dataset, spec.metricColumnY);
  const yAxisType = yIndex === -1 ? 'number' : dataset.get('columns').get(yIndex).get('type');
  const xIndex = getColumnIndex(dataset, spec.metricColumnX);
  const xAxisType = xIndex === -1 ? 'number' : dataset.get('columns').get(xIndex).get('type');
  const bucketIndex = getColumnIndex(dataset, spec.bucketColumn);
  const bucketType = bucketIndex === -1 ?
    'number' : dataset.get('columns').get(bucketIndex).get('type');
  const subBucketIndex = getColumnIndex(dataset, spec.subBucketColumn);
  const rowFilter = filterFn(spec.filters, dataset.get('columns'));

  const valueArray = dataset.get('rows')
    .filter(row => rowFilter(row))
    .map(row => ({
      y: row.get(yIndex),
      bucketValue: row.get(bucketIndex),
      subBucketValue: subBucketIndex > -1 ? row.get(subBucketIndex) : null,
    }))
    .toArray();

  /* If a sub-bucket aggregation is defined, include the raw values in the aggregated data,
  /* as we will need the raw values to calculate the sub-buckets */
  const ops = subBucketIndex > -1 ? [spec.metricAggregation, 'values'] : [spec.metricAggregation];

  let aggregatedValues = dl.groupby(['bucketValue'])
    .summarize([{
      name: 'y',
      ops,
      as: ['y'],
    }])
    .execute(valueArray);

  if (spec.sort) {
    aggregatedValues.sort((a, b) => (spec.sort === 'asc' ? a.y - b.y : b.y - a.y));
  }

  if (spec.truncateSize !== null) {
    const limit = parseInt(spec.truncateSize, 10);

    aggregatedValues = aggregatedValues.slice(0, limit);
  }

  let subBuckets;

  if (subBucketIndex > -1) {
    subBuckets = [];

    aggregatedValues.forEach((bucket) => {
      const parentMetric = bucket.y;
      const parentBucketValue = bucket.bucketValue;

      const parentSubBuckets = dl.groupby(['subBucketValue'])
        .summarize([{
          name: 'y',
          ops: [spec.metricAggregation],
          as: ['y'],
        }])
        .execute(bucket.values_y);

      parentSubBuckets.forEach((subBucket) => {
        const newSubBucket = Object.assign({}, subBucket);

        newSubBucket.parentMetric = parentMetric;
        newSubBucket.bucketValue = parentBucketValue;
        subBuckets.push(newSubBucket);
      });
    });
  }

  let maxBucketValue = null;

  if (subBucketIndex > -1 && spec.subBucketMethod === 'stack') {
    /* Sum the sub-bucket values for each bucket, then find the tallest "stack" in the chart,
    /* so we can set the chart y-axis to the correct height. */
    const summedBucketValues = dl.groupby(['bucketValue'])
          .summarize([{
            name: 'y',
            ops: ['sum'],
            as: ['total_bucket_value'],
          }])
          .execute(subBuckets);
    maxBucketValue = Math.max(...summedBucketValues.map(item => item.total_bucket_value));
  }

  return ([{
    name: 'table',
    values: subBucketIndex > -1 ? subBuckets : aggregatedValues,
    metadata: {
      yAxisType,
      xAxisType,
      bucketType,
      max: maxBucketValue,
    },
  }]);
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
