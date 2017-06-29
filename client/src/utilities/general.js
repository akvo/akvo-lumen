import { push } from 'react-router-redux';

export function getArrayFromObject(object) {
  return Object.keys(object).map(key => object[key]);
}

export function isImage(value) {
  // For now, treat every link as an image, until we have something like an "image-url" type
  if (typeof value === 'string' && value.match(/^https/) !== null) {
    return true;
  }
  return false;
}

export function formatTitle(title, maxTitleLength = 64) {
  if (!title) return title;
  if (title.toString().length <= maxTitleLength) return title;

  return `${title.toString().substring(0, maxTitleLength - 1)}…`;
}

function mergeQuery(location, query) {
  return Object.assign({}, location, {
    query: Object.assign({}, location.query, query),
  });
}

export function updateQueryAction(location, query) {
  return push(mergeQuery(location, query));
}
