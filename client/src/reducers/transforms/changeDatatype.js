import { columnIndex } from '../../utilities/dataset';

function makeParser(parser) {
  return (rows, idx, onError, args) => {
    const deleteMarker = {};
    const { defaultValue } = args;
    const dv = defaultValue != null ? parser(defaultValue) : null;
    const newRows = rows.map(row => {
      const clonedRow = row.slice(0);
      const val = clonedRow[idx];
      try {
        const parsedVal = parser(clonedRow[idx]);
        clonedRow[idx] = parsedVal;
        return clonedRow;
      } catch (error) {
        switch (onError) {
          case 'default-value':
            clonedRow[idx] = dv;
            return clonedRow;
          case 'fail':
            throw new Error(`Failed to parse ${val} as number`);
          case 'drop-row':
            return deleteMarker;
          default:
            throw new Error(`Unknown error strategy ${onError}`);
        }
      }
    });
    if (onError === 'drop-row') {
      return newRows.filter(row => row !== deleteMarker);
    }
    console.log(onError);
    console.log(newRows);
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

function numberToText() {

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
  const newRows = fn(dataset.rows, colIndex, onError, args);
  const columns = dataset.columns.slice(0);
  const newColumn = Object.assign({}, columns[colIndex], { type: newType });
  columns[colIndex] = newColumn;
  const newDataset = Object.assign({}, dataset, {
    columns,
    rows: newRows,
  });
  return newDataset;
}
