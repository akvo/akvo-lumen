import React, { PropTypes } from 'react';
import Immutable from 'immutable';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';
import { columnTitle } from '../../../domain/dataset';


function combineTransformationDescription(transformation, columns) {
  const firstColumnTitle =
    columnTitle(transformation.getIn(['args', 'columnNames', 0]), columns);
  const secondColumnTitle =
    columnTitle(transformation.getIn(['args', 'columnNames', 1]), columns);
  const newColumnTitle = transformation.getIn(['args', 'newColumnTitle']);
  return `Combined columns "${firstColumnTitle}" and "${secondColumnTitle}"
    into "${newColumnTitle}"`;
}

function transformationDescription(transformation, columns) {
  const op = transformation.get('op');
  const columnName = transformation.getIn(['args', 'columnName']);
  const newType = transformation.getIn(['args', 'newType']);
  const sortDirection = transformation.getIn(['args', 'sortDirection']);

  switch (op) {
    case 'core/to-lowercase':
      return `${columnTitle(columnName, columns)} to lowercase`;
    case 'core/to-uppercase':
      return `${columnTitle(columnName, columns)} to uppercase`;
    case 'core/to-titlecase':
      return `${columnTitle(columnName, columns)} to titlecase`;
    case 'core/trim':
      return `${columnTitle(columnName, columns)} trimmed whitespace`;
    case 'core/trim-doublespace':
      return `${columnTitle(columnName, columns)} trimmed double spaces`;
    case 'core/change-datatype':
      return `${columnTitle(columnName, columns)} datatype to ${newType}`;
    case 'core/sort-column':
      return `${columnTitle(columnName, columns)} sorted ${sortDirection}`;
    case 'core/combine':
      return combineTransformationDescription(transformation, columns);
    default:
      return op;
  }
}

function TransformationListItem({ transformation, columns }) {
  const isUndoingTransformation = transformation.get('undo');
  const isPendingTransformation = transformation.get('pending') && !isUndoingTransformation;

  return (
    <div style={{ opacity: isUndoingTransformation ? 0.5 : 1 }}>
      <div>{transformationDescription(transformation, columns)}</div>
      {isPendingTransformation && <div style={{ fontSize: '0.6em', marginTop: 4 }}>APPLYING TRANSFORMATION</div>}
      {isUndoingTransformation && <div style={{ fontSize: '0.6em', marginTop: 4 }}>UNDOING TRANSFORMATION</div>}
    </div>);
}

TransformationListItem.propTypes = {
  transformation: PropTypes.object.isRequired,
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
              transformation={transformation}
              columns={columns}
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
  pendingTransformations,
  columns,
}) {
  const allTransformations = transformationLog(transformations, pendingTransformations);

  return (
    <div
      className="DataTableSidebar"
      style={{
        width: '300px',
        height: 'calc(100vh - 8rem)',
      }}
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
        onApply={onUndo}
        onClose={onClose}
      />
    </div>
  );
}

TransformationLog.propTypes = {
  onClose: PropTypes.func.isRequired,
  onUndo: PropTypes.func.isRequired,
  columns: PropTypes.object.isRequired,
  transformations: PropTypes.object,
  pendingTransformations: PropTypes.object.isRequired,
};
