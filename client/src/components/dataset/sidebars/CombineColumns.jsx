import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { FormattedMessage, intlShape } from 'react-intl';
import SelectMenu from '../../common/SelectMenu';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';
import { filterColumns, columnSelectOptions, columnSelectSelectedOption } from '../../../utilities/column';
import { ensureImmutable } from '../../../utilities/utils';

function SelectColumn({ columns, idx, onChange, value, intl }) {
  const columnsSelect = ensureImmutable(filterColumns(columns, ['text']));
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
    const { onClose, onApply, columns, intl } = this.props;
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
            columns={columns}
            idx={1}
            onChange={value => this.handleSelectColumn(0, value)}
            value={args.getIn(['columnNames', 0])}
            intl={intl}
          />
          <SelectColumn
            columns={columns}
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
  intl: intlShape,
};
