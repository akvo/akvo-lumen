export function isValidEmail(email = '') {
  const regex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,9})+$/;
  return regex.test(email);
}

export function isTransformationColumn(c) {
  const n = c.get('columnName');
  return n && n.charAt(0) === 'd' && parseInt(n.substring(1), 10) > 0;
}

export function datasetHasQuestionGroups(columns) {
  return columns.filter(c => c.get('groupName') !== null && c.get('groupName') !== undefined).size > 0;
}

export function ensurePushIntoArray(a, k, v) {
  const x = a;
  if (x[k] === undefined) {
    x[k] = [v];
  } else {
    x[k].push(v);
  }
  return x;
}

export const flowCommonColumnNames = new Set(['identifier', 'instance_id', 'display_name', 'submitter', 'submitted_at', 'surveyal_time', 'device_id']);

export const reducerGroup = (metadataI18n, transformationsI18n) => (accumulator, c, idx) => {
  const column = c.set('idx', idx);
  const groupName = column.get('groupName');
  const columnName = column.get('columnName');
  if (groupName === 'null' || groupName === 'undefined' || groupName === null || groupName === undefined) {
    if (isTransformationColumn(column)) {
      return ensurePushIntoArray(accumulator, transformationsI18n, column);
    } else if (flowCommonColumnNames.has(columnName)) {
      return ensurePushIntoArray(accumulator, metadataI18n, column);
    }
    return ensurePushIntoArray(accumulator, ' ', column);
  }
  return ensurePushIntoArray(accumulator, groupName, column);
};


// Returns undefined if the object or any given nested key doesn't exist
export function checkUndefined(object = {}, ...keys) {
  if (!object || typeof object !== 'object') {
    return undefined;
  }

  if (keys.length === 0) {
    return object;
  }

  let currentObject = object;

  for (let i = 0; i < (keys.length - 1); i += 1) {
    const key = keys[i];

    if (!currentObject[key] || typeof currentObject[key] !== 'object') {
      return undefined;
    }

    currentObject = currentObject[key];
  }

  return currentObject[keys[keys.length - 1]];
}

/*
# arguments
columns: an array of objects, each of which has a "type" property
acceptableTypes: a single string or an array of strings

This could be extended in the future to support filtering on props other than type
*/
export function filterColumns(columns = [], acceptableTypes = []) {
  const types = Array.isArray(acceptableTypes) ? acceptableTypes : [acceptableTypes];
  return columns.filter(column => types.some(type => type === column.type));
}

export const sortAlphabetically = (a, b, accessor = val => val) => {
  const nameA = accessor(a).toLowerCase();
  const nameB = accessor(b).toLowerCase();
  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;
  return 0;
};

export const sortChronologically = (a, b, accessor = val => val) => {
  const dateA = accessor(a);
  const dateB = accessor(b);
  if (dateA < dateB) return -1;
  if (dateA > dateB) return 1;
  return 0;
};

/*
Takes an array of objects and returns a new array of all objects that have no "null" properties
*/
export const filterNullData = (dataArray = []) =>
  dataArray.filter(datum => Object.keys(datum).every(key => datum[key] !== null));

export const abbr = (text, maxLength) =>
  (text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text);
