import moment from 'moment';
import invariant from 'invariant';
import Immutable from 'immutable';

function get(entity, key) {
  if (Immutable.Map.isMap(entity)) {
    return entity.get(key);
  }
  return entity[key];
}

export function getTitle(entity) {
  const title = get(entity, 'title') || get(entity, 'name');
  invariant(
    title != null,
    'Title for %s with id %s must not be null',
    entity.type, entity.id
  );
  return title;
}

export function getId(entity) {
  const id = get(entity, 'id');
  invariant(
    id != null,
    'Id for entity %s must not be null',
    getTitle(entity)
  );
  return id;
}

export function getType(entity) {
  const type = get(entity, 'type');
  invariant(
    ['dataset', 'visualisation', 'dashboard', 'raster'].indexOf(type) >= 0,
    'Entity %s (%s) unknown entity type %s',
    getTitle(entity), getId(entity), type
  );
  return type;
}

export function getSource(entity) {
  const source = get(entity, 'source');
  if (!source) return null;
  return source.toJS();
}

export function getAuthor(entity) {
  let author = get(entity, 'author');
  if (!author) return null;
  if (author.toJS) author = author.toJS();
  return author && `${author.given_name} ${author.family_name}`;
}

export function isDataset(entity) {
  return getType(entity) === 'dataset';
}

export function isVisualisation(entity) {
  return getType(entity) === 'visualisation';
}

export function isDashboard(entity) {
  return getType(entity) === 'dashboard';
}

export function isRaster(entity) {
  return getType(entity) === 'raster';
}

export function getStatus(entity) {
  const status = get(entity, 'status');
  invariant(
    ['OK', 'PENDING', 'FAILED'].indexOf(status) >= 0,
    'Invalid status for entity %s: %s',
    getTitle(entity), status
  );
  return status;
}

export function isOk(entity) {
  return getStatus(entity) === 'OK';
}

export function isPending(entity) {
  return getStatus(entity) === 'PENDING';
}

export function isFailed(entity) {
  return getStatus(entity) === 'FAILED';
}

export function getCreatedTimestamp(entity) {
  const created = get(entity, 'created');
  invariant(
    Number.isInteger(created),
    'Invalid created timestamp for %s: %s',
    getTitle(entity), created
  );
  return created;
}

export function getModifiedTimestamp(entity) {
  const modified = get(entity, 'modified');
  invariant(
    Number.isInteger(modified),
    'Invalid created timestamp for %s: %s',
    getTitle(entity), modified
  );
  return modified;
}

export function getCreated(entity, format = 'MMMM Do YYYY') {
  return moment(getCreatedTimestamp(entity)).format(format);
}

export function getModified(entity, format = 'MMMM Do YYYY') {
  return moment(getModifiedTimestamp(entity)).format(format);
}

export function getErrorMessage(entity) {
  return get(entity, 'reason') || '';
}
