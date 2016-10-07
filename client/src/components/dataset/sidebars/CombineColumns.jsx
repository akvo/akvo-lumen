import React, { Component, PropTypes } from 'react';
import Immutable from 'immutable';
import SelectMenu from '../../common/SelectMenu';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';

function textColumnOptions(columns) {
  return columns.filter(column =>
    column.get('type') === 'text'
  ).map(column => ({
    label: column.get('title'),
    value: column.get('columnName'),
  })).toJS();
}

function SelectColumn({ columns, idx, onChange, value }) {
  return (
    <div className="inputGroup">
      <label
        htmlFor="columnName"
      >
        Select {idx === 0 ? 'first' : 'second'} column
      </label>
      <SelectMenu
        name="columnName"
        value={value}
        onChange={onChange}
        options={textColumnOptions(columns)}
      />
    </div>
  );
}

SelectColumn.propTypes = {
  columns: PropTypes.object.isRequired,
  idx: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default class CombineColumns extends Component {
  constructor() {
    super();
    this.state = {
      transformation: Immutable.fromJS({
        op: 'core/combine',
        args: {
          columnNames: [null, null],
          newColumnTitle: '',
          separator: ' ',
        },
        onError: 'fail',
      }),
    };
  }

  isValidTransformation() {
    const { transformation } = this.state;
    return transformation.getIn(['args', 'columnNames']).every((columnName) => columnName != null)
      && transformation.getIn(['args', 'newColumnTitle']) != '';
  }

  handleSelectColumn(idx, value) {
    const { transformation } = this.state;
    this.setState({
      transformation: transformation.setIn(['args', 'columnNames', idx], value),
    });
  }

  handleSelectSeparator(value) {
    const { transformation } = this.state;
    this.setState({
      transformation: transformation.setIn(['args', 'separator'], value),
    });
  }

  handleChangeNewColumnTitle(value) {
    const { transformation } = this.state;
    this.setState({
      transformation: transformation.setIn(['args', 'newColumnTitle'], value),
    });
  }

  render() {
    const { onClose, onApply, columns } = this.props;
    const args = this.state.transformation.get('args');
    return (
      <div
        className="DataTableSidebar"
        style={{
          width: '300px',
          height: 'calc(100vh - 4rem)',
        }}
      >
        <SidebarHeader onClose={onClose}>
          Combine columns
        </SidebarHeader>
        <div className="inputs">
          <SelectColumn
            columns={columns}
            idx={0}
            onChange={value => this.handleSelectColumn(0, value)}
            value={args.getIn(['columnNames', 0])}
          />
          <SelectColumn
            columns={columns}
            idx={1}
            onChange={value => this.handleSelectColumn(1, value)}
            value={args.getIn(['columnNames', 1])}
          />
          <div className="inputGroup">
            <label
              htmlFor="separator"
            >
              Select separator
            </label>
            <SelectMenu
              name="separator"
              value={args.get('separator')}
              onChange={value => this.handleSelectSeparator(value)}
              options={[
                {
                  label: 'Whitespace',
                  value: ' ',
                },
                {
                  label: 'Comma (,)',
                  value: ',',
                },
                {
                  label: 'None',
                  value: '',
                },
              ]}
            />
          </div>
          <div className="inputGroup">
            <label
              htmlFor="titleTextInput"
            >
              New column title
            </label>
            <input
              value={args.get('newColumnTitle')}
              type="text"
              className="titleTextInput"
              onChange={evt => this.handleChangeNewColumnTitle(evt.target.value)}
            />
          </div>
        </div>
        <SidebarControls
          positiveButtonText="Combine"
          onApply={this.isValidTransformation() ? () => onApply(this.state.transformation) : null}
          onClose={onClose}
        />
      </div>
    );
  }
}

CombineColumns.propTypes = {
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  columns: PropTypes.object.isRequired,
};
