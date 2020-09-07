import { isImmutable } from 'immutable';

import { ensurePushIntoArray } from './utils';

const collectionSize = o => (isImmutable(o) ? o.size : o.length);

const columnGroupName = column => (isImmutable(column) ? column.get('groupName') : column.groupName);
export const columnName = column => (isImmutable(column) ? column.get('columnName') : column.columnName);
const columnValue = column => (isImmutable(column) ? column.get('value') : column.value);
const columnLabel = column => (isImmutable(column) ? column.get('label') : column.label);
const columnLabelId = column => (isImmutable(column) ? column.get('labelId') : column.labelId);
const columnTitle = column => (isImmutable(column) ? column.get('title') : column.title);


export function isTransformationColumn(cName, cValue) {
  const n = cName || cValue;
  return n && n.charAt(0) === 'd' && parseInt(n.substring(1), 10) > 0;
}

export function datasetHasQuestionGroups(columns) {
  // eslint-disable-next-line max-len
  return collectionSize(columns.filter((c) => {
    const columnGroupIsNotNull = columnGroupName(c) !== null && columnGroupName(c) !== undefined;
    return columnGroupIsNotNull || isTransformationColumn(columnName(c), columnValue(c));
  })) > 0;
}

export const flowCommonColumnNames = new Set(['identifier', 'instance_id', 'display_name', 'submitter', 'submitted_at', 'surveyal_time', 'device_id']);

function assignProp(c, k, v) {
  const x = c;
  if (isImmutable(c)) {
    x.set(k, v);
  } else {
    x[k] = v;
  }
  return x;
}

export const reducerGroup = (metadataI18n, transformationsI18n) => (accumulator, c, idx) => {
  const column = assignProp(c, 'idx', idx);
  const gName = columnGroupName(column);
  const cName = columnName(column) || columnValue(column);
  if (gName === 'null' || gName === 'undefined' || gName === null || gName === undefined) {
    if (isTransformationColumn(columnName(column), columnValue(column))) {
      return ensurePushIntoArray(accumulator, transformationsI18n, column);
    } else if (flowCommonColumnNames.has(cName)) {
      return ensurePushIntoArray(accumulator, metadataI18n, column);
    }
    return ensurePushIntoArray(accumulator, ' ', column);
  }
  return ensurePushIntoArray(accumulator, gName, column);
};

/*
# arguments
columns: an array of objects, each of which has a "type" property
acceptableTypes: a single string or an array of strings

This could be extended in the future to support filtering on props other than type
*/
export function filterColumns(columns = [], acceptableTypes = []) {
  const types = Array.isArray(acceptableTypes) ? acceptableTypes : [acceptableTypes];
  return columns.filter(column => types.some(type => type === (isImmutable(column) ? column.get('type') : column.type)));
}

// eslint-disable-next-line max-len
export const findColumn = (columns, cName) => columns.filter(column => column.columnName === cName)[0];
export const findColumnI = (columns, cName) => columns.find(column => column.get('columnName') === cName);

export const columnSelectSelectedOption = (cValue, columns) => {
  const l = columns.find(c => (columnValue(c) || columnName(c)) === cValue);
  return l ? { value: columnValue(l) || columnName(l), label: columnLabel(l) || columnTitle(l) } : { value: '', label: '' };
};

export const columnSelectOptions = (intl, columns) => {
  function extractColumnOptions(cc) {
    return cc.map((c) => {
      const value = columnValue(c) || columnName(c);
      const label = columnLabel(c) || columnTitle(c);
      const labelId = columnLabelId(c);
      return {
        label: labelId ? intl.formatMessage({ id: labelId }) : label,
        value,
      };
    });
  }
  if (collectionSize(columns) > 0 && datasetHasQuestionGroups(columns)) {
    const groups = columns.reduce(reducerGroup('Metadata', 'Transformations'), {});
    const reducer2 = (accumulator, k) => {
      const columnsGroup = groups[k];
      accumulator.push({ label: k, options: extractColumnOptions(columnsGroup) });
      return accumulator;
    };
    return Object.keys(groups).reduce(reducer2, []);
  }
  const res = extractColumnOptions(columns);
  return isImmutable(res) ? res.toArray() : res;
};

export function namespace(groupId) {
  const mainG = new Set(['main', 'metadata', null, 'transformations']);
  return mainG.has(groupId) ? 'main' : groupId;
}
