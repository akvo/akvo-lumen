import React, { PropTypes } from 'react';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';

function TransformationList({ transformations = [], columns }) {
  return (
    <div style={{ padding: '1rem' }}>
      <ul>
        {transformations.map(({ op }, index) => (
          <li key={index}>{op}</li>
        ))}
      </ul>
    </div>
  );
}

TransformationList.propTypes = {
  transformations: PropTypes.array,
  columns: PropTypes.array.isRequired,
};

export default function TransformationLog({ onClose, transformations = [], columns }) {
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
        onApply={onClose}
        onClose={onClose}
      />
    </div>
  );
}

TransformationLog.propTypes = {
  onClose: PropTypes.func.isRequired,
  columns: PropTypes.array.isRequired,
  transformations: PropTypes.array,
};
