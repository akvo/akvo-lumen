import moment from 'moment';
import { columnIndex } from '../../domain/dataset';

function makeParser(parser) {
  return (rows, idx, onError, args) => {
    const deleteMarker = {};
    const defaultValue = args.get('defaultValue');
    const newRows = rows.map(row => {
      const val = row.get(idx);
      try {
        const parsedVal = parser(val, args);
        return row.set(idx, parsedVal);
      } catch (error) {
        switch (onError) {
          case 'default-value':
            return row.set(idx, defaultValue);
          case 'delete-row':
            return deleteMarker;
          case 'fail':
            throw new Error(`Failed to parse ${val} as number`);
          default:
            throw new Error(`Unknown error strategy ${onError}`);
        }
      }
    });
    if (onError === 'delete-row') {
      return newRows.filter(row => row !== deleteMarker);
    }
    return newRows;
  };
}

function textToNumber(s) {
  const n = parseFloat(s, 10);
  if (isNaN(n)) {
    throw new Error('Parse error');
  }
  return n;
}

function textToDate(s, args) {
  const parseFormat = args.get('parseFormat');
  if (!moment(s, parseFormat, true).isValid()) {
    throw new Error('Parse error');
  }
  return moment(s, parseFormat, true).unix();
}

function numberToText(n) {
  if (n == null) {
    throw new Error('Parse error');
  }
  return `${n}`;
}

function numberToDate(n) {
  if (n == null) {
    throw new Error('Parse error');
  }

  // Default value will be a string
  const num = typeof n === 'string' ? parseInt(n, 10) : n;
  if (isNaN(num) || num < 0) {
    throw new Error('ParseError');
  }
  return num;
}

function dateToNumber(n) {
  if (!moment(n, true).isValid()) {
    throw new Error('Parse error');
  }
  return n;
}

function dateToText(d) {
  if (!moment(d, true).isValid()) {
    throw new Error('Parse error');
  }
  return moment(d, true).format();
}

const transformationFunctions = {
  text: {
    number: makeParser(textToNumber),
    date: makeParser(textToDate),
  },
  number: {
    text: makeParser(numberToText),
    date: makeParser(numberToDate),
  },
  date: {
    text: makeParser(dateToText),
    number: makeParser(dateToNumber),
  },
};

export default function changeDatatype(dataset, transformation) {
  const args = transformation.get('args');
  const newType = args.get('newType');
  const columnName = args.get('columnName');
  const onError = transformation.get('onError');
  const columns = dataset.get('columns');
  const colIndex = columnIndex(columnName, columns);
  const prevType = columns.getIn([colIndex, 'type']);
  if (newType === prevType) {
    return dataset;
  }
  const fn = transformationFunctions[prevType][newType];
  const newRows = fn(dataset.get('rows'), colIndex, onError, args);
  const newDataset = dataset
    .set('rows', newRows)
    .setIn([colIndex, 'type'], newType);
  return newDataset;
}
