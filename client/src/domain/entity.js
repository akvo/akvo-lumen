import moment from 'moment';
import invariant from 'invariant';

export function getTitle(entity) {
  const title = entity.title || entity.name;
  invariant(
    title != null,
    'Title for %s with id %s must not be null',
    entity.type, entity.id
  );
  return title;
}

export function getId(entity) {
  const id = entity.id;
  invariant(
    id != null,
    'Id for entity %s must not be null',
    getTitle(entity)
  );
  return id;
}

export function getType(entity) {
  const type = entity.type;
  invariant(
    ['dataset', 'visualisation', 'dashboard'].indexOf(type) >= 0,
    'Entity %s (%s) unknown entity type %s',
    getTitle(entity), getId(entity), type
  );
  return type;
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

export function getStatus(entity) {
  const status = entity.status;
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
  const created = entity.created;
  invariant(
    Number.isInteger(created),
    'Invalid created timestamp for %s: %s',
    getTitle(entity), created
  );
  return created;
}

export function getModifiedTimestamp(entity) {
  const modified = entity.modified;
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
  return entity.reason || '';
}
