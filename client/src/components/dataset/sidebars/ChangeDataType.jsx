import React, { PropTypes } from 'react';
import DashSelect from '../../common/DashSelect';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';

const options = [
  {
    label: 'text',
    value: 'text',
  },
  {
    label: 'number',
    value: 'number',
  },
  {
    label: 'date',
    value: 'date',
  },
];

export default function ChangeDataType({ newColumnType, onClose }) {
  return (
    <div
      className="DataTableSidebar"
      style={{
        width: '300px',
        height: 'calc(100vh - 4rem)',
      }}
    >
      <SidebarHeader onClose={onClose}>
        Change data type
      </SidebarHeader>
      <div className="inputs">
        <div className="inputGroup">
          <label
            htmlFor="dataTypeMenu"
          >
            Change data type to:
          </label>
          <DashSelect
            name="dataTypeMenu"
            value={newColumnType}
            options={options}
          />
        </div>
        <div className="inputGroup">
          <label
            htmlFor="dateFormatMenu"
          >
            Date format:
          </label>
          <DashSelect
            name="dateFormatMenu"
            value="YYYY-MM-DD"
            options={[
              {
                value: 'YYYY-MM-DD',
                label: 'YYYY-MM-DD',
              },
              {
                value: 'DD-MM-YYYY',
                label: 'DD-MM-YYYY',
              },
              {
                value: 'MM-DD-YYYY',
                label: 'MM-DD-YYYY',
              },
            ]}
          />
        </div>
        <div className="inputGroup">
          <label
            htmlFor="ifInvalidInput"
          >
            If cell format is invalid:
          </label>
          <DashSelect
            name="dataTypeMenu"
            value="deleteRow"
            options={[
              {
                value: 'deleteRow',
                label: 'Delete row',
              },
              {
                value: 'emptyCell',
                label: 'Empty cell',
              },
              {
                value: 'chooseDefault',
                label: 'Pick a default value',
              },
            ]}
          />
        </div>
      </div>
      <SidebarControls
        onApply={onClose}
        onClose={onClose}
      />
    </div>
  );
}

ChangeDataType.propTypes = {
  newColumnType: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};
