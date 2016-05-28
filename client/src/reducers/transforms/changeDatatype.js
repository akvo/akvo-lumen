import _ from 'lodash';
import { columnIndex } from '../../utilities/dataset';

function makeParser(parser) {
  return (rows, idx, onError, args) => {
    const deleteMarker = {};
    const { defaultValue } = args;
    const dv = defaultValue != null ? parser(defaultValue) : null;
    const newRows = rows.map(row => {
      const r = row;
      const val = r[idx];
      try {
        const parsedVal = parser(row[idx]);
        r[idx] = parsedVal;
        return r;
      } catch (error) {
        switch (onError) {
          case 'default-value':
            r[idx] = dv;
            return r;
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

function textToDate() {

}

function numberToText(n) {
  if (n == null) {
    throw new Error('Parse error');
  }
  return `${n}`;
}

function numberToDate() {

}

function dateToNumber() {

}

function dateToText() {

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

export default function changeDatatype(dataset, { args, onError }) {
  const { newType, columnName } = args;
  const colIndex = columnIndex(columnName, dataset.columns);
  const prevType = dataset.columns[colIndex].type;
  if (newType === prevType) {
    return dataset;
  }
  const fn = transformationFunctions[prevType][newType];
  const clonedDataset = _.cloneDeep(dataset);
  const newRows = fn(clonedDataset.rows, colIndex, onError, args);
  clonedDataset.rows = newRows;
  clonedDataset.columns[colIndex].type = newType;
  return clonedDataset;
}
