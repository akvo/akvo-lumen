import React, { Component, PropTypes } from 'react';
import DashSelect from '../../common/DashSelect';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';

export default class Filter extends Component {
  render() {
    const { onClose } = this.props;
    return (
      <div
        className="DataTableSidebar"
        style={{
          width: '300px',
          height: 'calc(100vh - 4rem)',
        }}
      >
        <SidebarHeader onClose={onClose}>
          Filter
        </SidebarHeader>
        <div className="inputs">
          <div className="inputGroup">
            <label
              htmlFor="filterTypeMenu"
            >
              Show rows whose
            </label>
            <DashSelect
              name="filterTypeMenu"
              value="value-contains"
              options={[
                {
                  label: 'Value contains',
                  value: 'value-contains',
                },
                {
                  label: 'Value is',
                  value: 'value-is',
                },
              ]}
            />
          </div>
          <div className="inputGroup">
            <label
              htmlFor="filterTextInput"
            >
              Filter text
            </label>
            <input
              type="text"
              className="filterTextInput"
              ref="filterTextInput"
            />
          </div>
        </div>
        <SidebarControls
          positiveButtonText="Filter"
          onApply={onClose}
          onClose={onClose}
        />
      </div>
    );
  }
}

Filter.propTypes = {
  onClose: PropTypes.func.isRequired,
};
