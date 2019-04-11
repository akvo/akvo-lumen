import dl from 'datalib';
import moment from 'moment';
import { LABEL_CHAR_HEIGHT, LABEL_CHAR_WIDTH } from '../constants/chart';

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
  // We use a date value of "1001-01-01 01:00:00" to represent a missing date when we can't use null
  const isMagicDateValue = new Date(label).getTime() === -30578684400000;

  if (label == null || label === 'null' || label === 'NaN' || label === '' || isMagicDateValue) {
    return getCssClassname ? 'emptyValue' : displayTextForNullValues;
  }
  return getCssClassname ? 'dataValue' : label;
};

/* Get formatted visualisation data */

export function getLineData(visualisation, dataset) {
  const { spec } = visualisation;
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

export function getScatterData(visualisation, dataset) {
  const { spec } = visualisation;
  const haveAggregation = visualisation.spec.bucketColumn != null;
  const yIndex = getColumnIndex(dataset, spec.metricColumnY);
  const yAxisType = yIndex === -1 ? 'number' : dataset.getIn(['columns', yIndex, 'type']);
  const xIndex = getColumnIndex(dataset, spec.metricColumnX);
  const xAxisType = xIndex === -1 ? 'number' : dataset.getIn(['columns', xIndex, 'type']);
  const bucketIndex = getColumnIndex(dataset, spec.bucketColumn);
  const bucketType = bucketIndex === -1 ?
    'number' : dataset.getIn(['columns', bucketIndex, 'type']);
  const bucketName = bucketIndex === -1 ?
    '' : dataset.getIn(['columns', bucketIndex, 'title']);
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
      bucketName,
      datapointLabelType,
    },
  }];
}

/* Format the aggregated data for display, including replacing null text and sorting */
export function formatPieData(aggregationData) {
  const bucketColumnType = aggregationData.metadata.bucketColumnType;
  const formattedData = Object.assign({}, aggregationData);

  formattedData.data = formattedData.data.map((item) => {
    const cItem = Object.assign({}, item);
    cItem.bucketValue = replaceLabelIfValueEmpty(cItem.bucketValue);
    return cItem;
  });

  formattedData.data.sort((a, b) => {
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
    values: formattedData.data,
  }];
}

export function getBarData(visualisation, dataset) {
  const { spec } = visualisation;
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
    const va = a.value == null || a.value === 'null' ? Infinity : parseFloat(a.value);
    const vb = b.value == null || b.value === 'null' ? Infinity : parseFloat(b.value);

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

export const round = (input, places) => {
  let num;
  if (typeof input === 'number') {
    num = input;
  } else {
    num = Number(input);
    if (isNaN(num)) {
      return input;
    }
  }
  // eslint-disable-next-line no-restricted-properties
  return Math.round(num * Math.pow(10, places)) / Math.pow(10, places);
};

export const heuristicRound = (input) => {
  let num;
  if (typeof input === 'number') {
    num = input;
  } else {
    num = Number(input);
    if (isNaN(num)) {
      return input;
    }
  }

  let places;

  if (num < 0.0000001) {
    places = 10;
  } else if (num < 0.000001) {
    places = 9;
  } else if (num < 0.00001) {
    places = 8;
  } else if (num < 0.00001) {
    places = 7;
  } else if (num < 0.0001) {
    places = 6;
  } else if (num < 0.001) {
    places = 5;
  } else if (num < 0.01) {
    places = 4;
  } else {
    places = 2;
  }

  return round(num, places);
};

const percentageRow = (rows, spec) => {
  const totalsRowIndex = rows.length - 1;

  return rows.map((row, index) => {
    const totalCellIndex = row.length - 1;
    const rowTotal = row[totalCellIndex];
    const clonedRow = row.slice(0);
    const isTotalsRow = index === totalsRowIndex;

    for (let i = 1; i < row.length; i += 1) {
      const cell = row[i];
      const percentage = round((cell / rowTotal) * 100, 1);
      const value = cell === null ? 0 : round(cell, spec.decimalPlaces);
      const isTotalCell = i === row.length - 1;
      const includeCount = isTotalsRow || isTotalCell;

      clonedRow[i] = includeCount ? `${percentage}% (${value})` : `${percentage}%`;
    }

    return clonedRow;
  });
};

const percentageColumn = (rows, spec) => {
  const totalsRowIndex = rows.length - 1;
  const totalRow = rows[totalsRowIndex];

  return rows.map((row, index) => {
    const clonedRow = row.slice(0);
    const isTotalsRow = index === totalsRowIndex;

    for (let i = 1; i < row.length; i += 1) {
      const columnTotal = totalRow[i];
      const cell = row[i];
      const percentage = round((cell / columnTotal) * 100, 1);
      const value = cell === null ? 0 : round(cell, spec.decimalPlaces);
      const isTotalCell = i === row.length - 1;
      const includeCount = isTotalsRow || isTotalCell;

      clonedRow[i] = includeCount ? `${percentage}% (${value})` : `${percentage}%`;
    }

    return clonedRow;
  });
};

const percentageTotal = (rows, spec) => {
  const totalsRowIndex = rows.length - 1;
  const totalRow = rows[totalsRowIndex];
  const total = totalRow[totalRow.length - 1];

  return rows.map((row, index) => {
    const clonedRow = row.slice(0);
    const isTotalsRow = index === rows.length - 1;

    for (let i = 1; i < row.length; i += 1) {
      const cell = row[i];
      const percentage = round((cell / total) * 100, 1);
      const value = cell === null ? 0 : round(cell, spec.decimalPlaces);
      const isTotalCell = i === row.length - 1;
      const includeCount = isTotalsRow || isTotalCell;

      clonedRow[i] = includeCount ? `${percentage}% (${value})` : `${percentage}%`;
    }

    return clonedRow;
  });
};

export function canShowPivotTotals(spec) {
  const validCountSpec = spec.aggregation === 'count';
  const validSumSpec = spec.aggregation === 'sum' && spec.valueColumn !== null;
  const validTotalsSpec = validCountSpec || validSumSpec;
  const haveBothDimensions = spec.categoryColumn && spec.rowColumn;

  return validTotalsSpec && haveBothDimensions;
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

  if (canShowPivotTotals(spec)) {
    // Populate the "Total" row with a title cell and a 0 for each column
    // (including the new row-total column which we haven't built yet)
    const totalsRow = ['Total'];
    out.rows[0].forEach(() => totalsRow.push(0));

    // Build a new array of rows with a row-total cell appended to each row.
    // While iterating through the rows, also sum each cell value with
    // the corresponding column-total cell in `totalsRow`
    let processedRows = out.rows.map((row) => {
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

    if (spec.valueDisplay === 'percentageRow') {
      processedRows = percentageRow(processedRows, spec);
    } else if (spec.valueDisplay === 'percentageColumn') {
      processedRows = percentageColumn(processedRows, spec);
    } else if (spec.valueDisplay === 'percentageTotal') {
      processedRows = percentageTotal(processedRows, spec);
    }

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

const isRatio = val => val > 0 && val < 1;
export function calculateMargins({ top, right, bottom, left }, { width, height }) {
  return {
    top: isRatio(top) ? top * height : top,
    right: isRatio(right) ? right * width : right,
    bottom: isRatio(bottom) ? bottom * height : bottom,
    left: isRatio(left) ? left * width : left,
  };
}

export const getLabelFontSize = (xLabel = '', yLabel = '', maxFont, minFont, height, width) => {
  const longest = Math.max(xLabel ? xLabel.length : 0, yLabel ? yLabel.length : 0);
  const smallestDimension = Math.min(height, width);
  const smallChartSize = smallestDimension < 400;
  const mediumChartSize = smallestDimension > 400 && smallestDimension < 700;
  const mediumFont = Math.floor(0.5 * (minFont + maxFont));

  if (longest > 45 && smallChartSize) {
    return minFont;
  }

  if (longest > 60 && mediumChartSize) {
    return minFont;
  }

  if (longest > 45 && mediumChartSize) {
    return mediumFont;
  }

  return maxFont;
};

export const getTitle = visualisation => visualisation.name;

const DATE_FORMAT = 'Do MMM YYYY - HH:mm';

export const getDataLastUpdated = ({ visualisation, datasets }) => {
  if (!datasets) return null;
  switch (visualisation.visualisationType) {
    case 'map': {
      const mostRecentlyUpdatedLayerDataset = visualisation.spec.layers
        .map(({ datasetId }) => datasets[datasetId])
        .sort((a, b) => {
          if (a.get('updated') < b.get('updated')) return 1;
          if (a.get('updated') > b.get('updated')) return -1;
          return 0;
        })[0];
      return mostRecentlyUpdatedLayerDataset ?
        moment(mostRecentlyUpdatedLayerDataset.get('updated')).format(DATE_FORMAT) :
        null;
    }
    case 'bar':
    case 'pivot table':
    case 'scatter':
    case 'area':
    case 'line':
    case 'donut':
    case 'pie': {
      const dataset = datasets[visualisation.datasetId];
      if (!dataset) return null;
      return moment(dataset.get('modified')).format(DATE_FORMAT);
    }
    default: {
      return null;
    }
  }
};


const labelWidth = text => `${text}`.length * LABEL_CHAR_WIDTH;
export const labelFitsWidth = (text, width) => labelWidth(text) < width;
export const labelFitsHeight = height => height > LABEL_CHAR_HEIGHT;
