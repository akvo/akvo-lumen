import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { FormattedMessage } from 'react-intl';
import SelectMenu from '../../common/SelectMenu';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';

function textColumnOptions(columns) {
  return columns.filter(column =>
    (column.get('type') === 'text' && column.get('caddisflyResourceUuid'))
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
        <FormattedMessage
          id="select_n_column"
          values={{ idx }}
        />
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

export default class ExtractCaddisfly extends Component {
  constructor() {
    super();
    this.state = {
      transformation: Immutable.fromJS({
        op: 'core/extract-caddisfly',
        args: {
          columnName: ''
        },
        onError: 'fail',
      }),
    };
  }

  isValidTransformation() {
    const { transformation } = this.state;
      return transformation.getIn(['args', 'columnName']) !== '';
  }

  handleSelectColumn(value) {
    const { transformation } = this.state;
    this.setState({
      transformation: transformation.setIn(['args', 'columnName'], value),
    });
  }

  render() {
    const { onClose, onApply, columns } = this.props;
    const args = this.state.transformation.get('args');
    return (
      <div className="DataTableSidebar">
        <SidebarHeader onClose={onClose}>
          <FormattedMessage id="extract_caddisfly" />
        </SidebarHeader>
        <div className="inputs">
          <SelectColumn
            columns={columns}
            idx={1}
            onChange={value => this.handleSelectColumn(value)}
            value={args.get('columnName')}
          />
        </div>
        <SidebarControls
          positiveButtonText={<FormattedMessage id="extract" />}
          onApply={this.isValidTransformation() ? () => onApply(this.state.transformation) : null}
          onClose={onClose}
        />
      </div>
    );
  }
}

ExtractCaddisfly.propTypes = {
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  columns: PropTypes.object.isRequired,
};
