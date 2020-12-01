import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { get } from 'lodash';
import { FormattedMessage, intlShape } from 'react-intl';
import SelectMenu from '../../common/SelectMenu';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';
import {
  filterColumns,
  columnSelectOptions,
  columnSelectSelectedOption,
  filterColumnsByDataGroupDimension,
} from '../../../utilities/column';

function SelectColumn({ columns, idx, onChange, value, intl }) {
  const columnsSelect = filterColumns(columns, ['text', 'option']);
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
        value={columnSelectSelectedOption(value, columnsSelect)}
        onChange={onChange}
        options={columnSelectOptions(intl, columnsSelect)}
        clearable
      />
    </div>
  );
}

SelectColumn.propTypes = {
  columns: PropTypes.object.isRequired,
  idx: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  intl: intlShape,
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

  getColumns(selectId) {
    const oppositeColumnId = selectId === 1 ? 0 : 1; // setting the id to check the opposite column
    const args = this.state.transformation.get('args');
    const oppositeColumnName = args.getIn(['columnNames', oppositeColumnId]);
    let columns = this.props.columns;
    if (get(this.props.env, 'environment.data-groups') && this.props.group) {
      columns = columns.filter(x => x.get('groupId') === this.props.group.get('groupId'));
    }
    return filterColumnsByDataGroupDimension(columns, oppositeColumnName);
  }

  isValidTransformation() {
    const { transformation } = this.state;
    return transformation.getIn(['args', 'columnNames']).every(columnName => columnName != null)
      && transformation.getIn(['args', 'newColumnTitle']) !== '';
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
    const { onClose, onApply, intl } = this.props;
    const args = this.state.transformation.get('args');
    return (
      <div
        className="DataTableSidebar"
      >
        <SidebarHeader onClose={onClose}>
          <FormattedMessage id="combine_columns" />
        </SidebarHeader>
        <div className="inputs">
          <SelectColumn
            columns={this.getColumns(0)}
            idx={1}
            onChange={value => this.handleSelectColumn(0, value)}
            value={args.getIn(['columnNames', 0])}
            intl={intl}
          />
          <SelectColumn
            columns={this.getColumns(1)}
            idx={2}
            onChange={value => this.handleSelectColumn(1, value)}
            value={args.getIn(['columnNames', 1])}
            intl={intl}
          />
          <div className="inputGroup">
            <label
              htmlFor="separator"
            >
              <FormattedMessage id="select_separator" />
            </label>
            <SelectMenu
              name="separator"
              value={args.get('separator')}
              onChange={value => this.handleSelectSeparator(value)}
              options={[
                {
                  label: <FormattedMessage id="whitespace" />,
                  value: ' ',
                },
                {
                  label: <span><FormattedMessage id="comma" /> (,)</span>,
                  value: ',',
                },
                {
                  label: <span><FormattedMessage id="hyphen" /> (-)</span>,
                  value: '-',
                },
                {
                  label: <FormattedMessage id="none" />,
                  value: '',
                },
              ]}
            />
          </div>
          <div className="inputGroup">
            <label
              htmlFor="titleTextInput"
            >
              <FormattedMessage id="new_column_title" />
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
          positiveButtonText={<FormattedMessage id="combine" />}
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
  env: PropTypes.object,
  group: PropTypes.object,
  intl: intlShape,
};
