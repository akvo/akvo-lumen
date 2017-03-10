import dl from 'datalib';
import getVegaScatterSpec from './vega-specs/Scatter';
import getVegaPieSpec from './vega-specs/Pie';
import getVegaAreaSpec from './vega-specs/Area';
import getVegaBarSpec from './vega-specs/Bar';

// Special value that will always come last alphabetically. Used for sorting.
const lastValueAlphabetically = '';

/* Filtering */

const getFilterArray = (filters, columns) => {
  const filterArray = [];

  for (let i = 0; i < filters.length; i += 1) {
    const filter = filters[i];
    const columnIndex = columns.findIndex(col => col.get('columnName') === filter.column);
    const columnType = columns.getIn([columnIndex, 'type']);
    let testValue;
    switch (columnType) {
      case 'date':
        testValue = parseInt(filter.value, 10);
        break;
      case 'number':
        testValue = parseFloat(filter.value);
        break;
      case 'text':
        testValue = filter.value;
        break;
      default:
        throw new Error(`Invalid column type: ${columnType}`);
    }


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

/* Deal with blank values */

const displayTextForNullValues = 'No data';

export const replaceLabelIfValueEmpty = (label, getCssClassname) => {
  if (label == null || label === 'null' || label === '') {
    return getCssClassname ? 'emptyValue' : displayTextForNullValues;
  }
  return getCssClassname ? 'dataValue' : label;
};

/* Get formatted visualisation data */

export function getLineData(visualisation, datasets) {
  const { datasetId, spec } = visualisation;
  const dataset = datasets[datasetId];
  const haveAggregation = visualisation.spec.metricAggregation != null;
  const yIndex = getColumnIndex(dataset, spec.metricColumnY);
  const xIndex = getColumnIndex(dataset, spec.metricColumnX);
  const xAxisType = xIndex === -1 ? 'number' : dataset.getIn(['columns', xIndex, 'type']);
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
  const yAxisType = yIndex === -1 ? 'number' : dataset.getIn(['columns', yIndex, 'type']);
  const xIndex = getColumnIndex(dataset, spec.metricColumnX);
  const xAxisType = xIndex === -1 ? 'number' : dataset.getIn(['columns', xIndex, 'type']);
  const bucketIndex = getColumnIndex(dataset, spec.bucketColumn);
  const bucketType = bucketIndex === -1 ?
    'number' : dataset.getIn(['columns', bucketIndex, 'type']);
  const datapointLabelIndex = getColumnIndex(dataset, spec.datapointLabelColumn);
  const datapointLabelType = datapointLabelIndex === -1 ?
    'number' : dataset.getIn(['columns', datapointLabelIndex, 'type']);
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
  const bucketColumnType = dataset.getIn(['columns', bucketIndex, 'type']);
  const rowFilter = filterFn(spec.filters, dataset.get('columns'));

  const valueArray = dataset.get('rows')
    .filter(row => rowFilter(row))
    .map(row => ({
      bucketValue: replaceLabelIfValueEmpty(row.get(bucketIndex)),
    }))
    .toArray();

  const aggregatedValues = dl.groupby(['bucketValue'])
    .summarize([{
      name: 'bucketValue',
      ops: ['count'],
      as: ['bucketCount'],
    }])
    .execute(valueArray)
    .sort((a, b) => {
      if (bucketColumnType === 'text') {
        const emptyValueText = replaceLabelIfValueEmpty(null);
        const valA = a.bucketValue === emptyValueText ? lastValueAlphabetically : a.bucketValue;
        const valB = b.bucketValue === emptyValueText ? lastValueAlphabetically : b.bucketValue;

        return valA.localeCompare(valB);
      }

      // Bucket value might still be a string if this is the "empty value" bucket
      let valA = parseFloat(a.bucketValue);
      let valB = parseFloat(b.bucketValue);

      // If this is the "empty value" bucket, make sure it comes last in the chart
      if (isNaN(valA)) valA = Infinity;
      if (isNaN(valB)) valB = Infinity;

      return valA - valB;
    });

  return [{
    name: 'table',
    values: aggregatedValues,
  }];
}

export function getBarData(visualisation, datasets) {
  const { datasetId, spec } = visualisation;
  const dataset = datasets[datasetId];
  const yIndex = getColumnIndex(dataset, spec.metricColumnY);
  const yAxisType = yIndex === -1 ? 'number' : dataset.getIn(['columns', yIndex, 'type']);
  const xIndex = getColumnIndex(dataset, spec.metricColumnX);
  const xAxisType = xIndex === -1 ? 'number' : dataset.getIn(['columns', xIndex, 'type']);
  const bucketIndex = getColumnIndex(dataset, spec.bucketColumn);
  const bucketType = bucketIndex === -1 ?
    'number' : dataset.getIn(['columns', bucketIndex, 'type']);
  const subBucketIndex = getColumnIndex(dataset, spec.subBucketColumn);
  const rowFilter = filterFn(spec.filters, dataset.get('columns'));

  const valueArray = dataset.get('rows')
    .filter(row => rowFilter(row))
    .map(row => ({
      y: row.get(yIndex),
      bucketValue: replaceLabelIfValueEmpty(row.get(bucketIndex)),
      subBucketValue: subBucketIndex > -1 ?
        replaceLabelIfValueEmpty(row.get(subBucketIndex)) : null,
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

/* Map helpers */

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

export const getPointColorMappingSortFunc = (columnType) => {
  const sortText = (a, b) => {
    const va = (a.value == null || a.value === 'null' || a.value === '') ? lastValueAlphabetically : a.value;
    const vb = (b.value == null || b.value === 'null' || b.value === '') ? lastValueAlphabetically : b.value;

    return va > vb;
  };

  const sortNonText = (a, b) => {
    const va = a.value == null ? Infinity : parseFloat(a.value);
    const vb = b.value == null ? Infinity : parseFloat(b.value);

    return va - vb;
  };

  return columnType === 'text' ? sortText : sortNonText;
};

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
        dataset.getIn(['columns', pointColorIndex, 'type']) : null,
    },
  });
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

// Add totals to pivot data, where appropriate
export function processPivotData(data, spec) {
  if (!data || !data.rows || data.rows.length === 0) {
    return data;
  }

  const out = Object.assign({}, data,
    {
      rows: data.rows.map(item => item),
      columns: data.columns.map(item => item),
      metadata: Object.assign({}, data.metadata),
    }
  );

  const validCountSpec = spec.aggregation === 'count';
  const validSumSpec = spec.aggregation === 'sum' && spec.valueColumn !== null;
  const validTotalsSpec = validCountSpec || validSumSpec;
  const haveBothDimensions = spec.categoryColumn && spec.rowColumn;

  if (validTotalsSpec && haveBothDimensions) {
    // Populate the "Total" row with a title cell and a 0 for each column
    // (including the new row-total column which we haven't built yet)
    const totalsRow = ['Total'];
    out.rows[0].forEach(() => totalsRow.push(0));

    // Build a new array of rows with a row-total cell appended to each row.
    // While iterating through the rows, also sum each cell value with
    // the corresponding column-total cell in `totalsRow`
    const processedRows = out.rows.map((row) => {
      const clonedRow = row.map(item => item);
      let rowTotal = 0;

      // Start from 1 because first cell is row title
      for (let i = 1; i < clonedRow.length; i += 1) {
        const cell = clonedRow[i];

        totalsRow[i] += cell;
        rowTotal += cell;
      }
      // Append the new row-total cell to the row
      clonedRow.push(rowTotal);

      // Sum the new row-total cell with last column-total cell in `totalsRow`
      totalsRow[totalsRow.length - 1] += rowTotal;

      return clonedRow;
    });

    processedRows.push(totalsRow);

    out.rows = processedRows;
    out.columns.push({
      title: 'Total',
      type: 'number',
    });

    out.metadata.hasRowTotals = true;
    out.metadata.hasColumnTotals = true;
  }

  return out;
}

