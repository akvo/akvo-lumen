import React, { PropTypes } from 'react';
import Immutable from 'immutable';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';
import { columnTitle } from '../../../domain/dataset';

function deriveTransformationDescription(transformation) {
  const newColumnTitle = transformation.getIn(['args', 'newColumnTitle']);
  const code = transformation.getIn(['args', 'code']);
  return (
    <div>
      Derived {newColumnTitle} using <code>{code}</code>
    </div>
  );
}

// Search the transformation list to find the column title and fall back to the columnTitle
// function if this column hasn't been transformed before.
function findTitle(columnName, transformations, index, columns) {
  const historyTransformation = transformations.take(index).reverse().find(transformation =>
      transformation.getIn(['changedColumns', columnName]));
  if (historyTransformation != null) {
    return historyTransformation.getIn(['changedColumns', columnName, 'after', 'title']);
  }

  const futureTransformation = transformations.skip(index).find(transformation =>
    transformation.getIn(['changedColumns', columnName]));
  if (futureTransformation != null) {
    return futureTransformation.getIn(['changedColumns', columnName, 'before', 'title']);
  }

  return columnTitle(columnName, columns);
}

function combineTransformationDescription(transformations, index, columns) {
  const transformation = transformations.get(index);
  const firstColumnName = transformation.getIn(['args', 'columnNames', 0]);
  const secondColumnName = transformation.getIn(['args', 'columnNames', 1]);
  const firstTitle = findTitle(firstColumnName, transformations, index, columns);
  const secondTitle = findTitle(secondColumnName, transformations, index, columns);
  const newColumnTitle = transformation.getIn(['args', 'newColumnTitle']);
  return `Combined columns ${firstTitle} and ${secondTitle} into "${newColumnTitle}"`;
}

function transformationDescription(transformations, index, columns) {
  const transformation = transformations.get(index);
  const op = transformation.get('op');
  const columnName = transformation.getIn(['args', 'columnName']);
  const title = transformation.getIn(['changedColumns', columnName, 'before', 'title']);
  switch (op) {
    case 'core/to-lowercase':
      return `${title} to lowercase`;
    case 'core/to-uppercase':
      return `${title} to uppercase`;
    case 'core/to-titlecase':
      return `${title} to titlecase`;
    case 'core/trim':
      return `${title} trimmed whitespace`;
    case 'core/trim-doublespace':
      return `${title} trimmed double spaces`;
    case 'core/change-datatype':
      return `${title} datatype to ${transformation.getIn(['args', 'newType'])}`;
    case 'core/sort-column':
      return `${title} sorted ${transformation.getIn(['args', 'sortDirection'])}`;
    case 'core/rename-column':
      return `Renamed ${title} to ${transformation.getIn(['args', 'newColumnTitle'])}`;
    case 'core/delete-column':
      return `Deleted ${title}`;
    case 'core/combine':
      return combineTransformationDescription(transformations, index, columns);
    case 'core/derive':
      return deriveTransformationDescription(transformation);
    default:
      return op;
  }
}

function TransformationListItem({ transformations, index, columns }) {
  const transformation = transformations.get(index);
  const isUndoingTransformation = transformation.get('undo');
  const isPendingTransformation = transformation.get('pending') && !isUndoingTransformation;

  return (
    <div style={{ opacity: isUndoingTransformation ? 0.5 : 1 }}>
      <div>
        {transformationDescription(transformations, index, columns)}
      </div>
      {isPendingTransformation && <div style={{ fontSize: '0.6em', marginTop: 4 }}>APPLYING TRANSFORMATION</div>}
      {isUndoingTransformation && <div style={{ fontSize: '0.6em', marginTop: 4 }}>UNDOING TRANSFORMATION</div>}
    </div>);
}

TransformationListItem.propTypes = {
  transformations: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  columns: PropTypes.object.isRequired,
};

function TransformationList({ transformations, columns }) {
  return (
    <div
      className="TransformationList"
    >
      <ol>
        {transformations.map((transformation, index) => (
          <li key={index}>
            <TransformationListItem
              transformations={transformations}
              columns={columns}
              index={index}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

TransformationList.propTypes = {
  transformations: PropTypes.object.isRequired,
  columns: PropTypes.object.isRequired,
};

function markUndo(transformations, idx) {
  if (idx < 0) {
    return transformations;
  }
  if (transformations.getIn([idx, 'undo'])) {
    return markUndo(transformations, idx - 1);
  }
  return transformations.setIn([idx, 'undo'], true);
}

function transformationLog(persistedTransformations, pendingTransformations) {
  let allTransformations = persistedTransformations;
  pendingTransformations.forEach((pendingTransformation) => {
    if (pendingTransformation.get('op') === 'undo') {
      allTransformations = markUndo(allTransformations, allTransformations.size - 1);
    } else {
      allTransformations = allTransformations.push(pendingTransformation.set('pending', true));
    }
  });
  return allTransformations;
}

export default function TransformationLog({
  onClose,
  onUndo,
  transformations = Immutable.List(),
  columns,
  pendingTransformations,
}) {
  const allTransformations = transformationLog(transformations, pendingTransformations);

  return (
    <div
      className="DataTableSidebar"
    >
      <SidebarHeader onClose={onClose}>
        Transformation Log
      </SidebarHeader>
      <TransformationList
        transformations={allTransformations}
        columns={columns}
      />
      <SidebarControls
        positiveButtonText="Undo"
        onApply={
          allTransformations.every(transformation => transformation.get('undo')) ? null : onUndo
        }
        onClose={onClose}
      />
    </div>
  );
}

TransformationLog.propTypes = {
  onClose: PropTypes.func.isRequired,
  onUndo: PropTypes.func.isRequired,
  transformations: PropTypes.object,
  columns: PropTypes.object.isRequired,
  pendingTransformations: PropTypes.object.isRequired,
};
