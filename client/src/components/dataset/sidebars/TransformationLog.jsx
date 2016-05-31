import React, { PropTypes } from 'react';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';
import { columnTitle } from '../../../utilities/dataset';


function transformationDescription({ op, args }, columns) {
  const { columnName, newType } = args;
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
    default:
      return op;
  }
}

function TransformationListItem({ transformation, columns }) {
  return <span>{transformationDescription(transformation, columns)}</span>;
}

TransformationListItem.propTypes = {
  transformation: PropTypes.object.isRequired,
  columns: PropTypes.array.isRequired,
};

function TransformationList({ transformations = [], columns }) {
  return (
    <div style={{ padding: '1rem' }}>
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
  transformations: PropTypes.array,
  columns: PropTypes.array.isRequired,
};

export default function TransformationLog({ onClose, onUndo, transformations = [], columns }) {
  return (
    <div
      className="DataTableSidebar"
      style={{
        width: '300px',
        height: 'calc(100vh - 4rem)',
      }}
    >
      <SidebarHeader onClose={onClose}>
        Transformation Log
      </SidebarHeader>
      <TransformationList
        transformations={transformations}
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
  columns: PropTypes.array.isRequired,
  transformations: PropTypes.array,
};
