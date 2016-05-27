import React, { PropTypes } from 'react';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';

export default function TransformationLog({ onClose }) {
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
      <div style={{ padding: '1rem' }}>
        Transformation log not yet implemented.
      </div>
      <SidebarControls
        onApply={onClose}
        onClose={onClose}
      />
    </div>
  );
}

TransformationLog.propTypes = {
  onClose: PropTypes.func.isRequired,
};
