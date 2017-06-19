import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import SelectMenu from '../../common/SelectMenu';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';
import DateFormatSelect from './DateFormatSelect';

function DefaultValueInput({ defaultValue, onChange, newType }) {
  const emptyValue = newType === 'num' ? 0 : '';
  return (
    <div className="inputGroup">
      <label htmlFor="defaultValueInput">
        Default value:
      </label>
      <input
        type={newType === 'num' ? 'num' : 'text'}
        value={(defaultValue !== null && !isNaN(defaultValue)) ? defaultValue : emptyValue}
        onChange={(event) => {
          const value = event.target.value;
          if (newType === 'date') {
            const n = isNaN(value) ? null : parseInt(value, 10);
            onChange(n);
          } else if (newType === 'num') {
            const n = parseFloat(value);
            onChange(n);
          } else {
            onChange(value);
          }
        }}
      />
    </div>
  );
}

DefaultValueInput.propTypes = {
  defaultValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onChange: PropTypes.func.isRequired,
  newType: PropTypes.oneOf(['date', 'text', 'num']).isRequired,
};


const errorOptions = [
  {
    value: 'empty-cell',
    label: 'Leave empty',
  },
  {
    value: 'default-value',
    label: 'Pick a default value',
  },
  {
    value: 'fail',
    label: 'Abort transformation',
  },
  {
    value: 'delete-row',
    label: 'Delete the row',
  },
];

export default class ChangeDataType extends Component {

  constructor() {
    super();
    this.state = {};
    this.handleChangeErrorStrategy = this.handleChangeErrorStrategy.bind(this);
    this.mergeArgs = this.mergeArgs.bind(this);
  }


  componentWillMount() {
    const { column, newColumnType } = this.props;
    this.setState({
      transformation: Immutable.fromJS({
        op: 'core/change-datatype',
        args: {
          columnName: column.get('columnName'),
          newType: newColumnType,
          defaultValue: null,
          parseFormat: 'YYYY-MM-DD',
        },
        onError: 'default-value',
      }),
      errorStrategy: 'empty-cell',
    });
  }

  mergeArgs(args) {
    const transformation = this.state.transformation;
    this.setState({ transformation: transformation.mergeIn(['args'], args) });
  }

  handleChangeErrorStrategy(errorStrategy) {
    const transformation = this.state.transformation;
    const onError = errorStrategy === 'empty-cell' ? 'default-value' : errorStrategy;
    const defaultValue = errorStrategy === 'empty-cell' ?
      null : transformation.getIn(['args', 'defaultValue']);
    this.setState({
      errorStrategy,
      transformation: transformation
        .set('onError', onError)
        .setIn(['args', 'defaultValue'], defaultValue),
    });
  }

  isValidTransformation() {
    return this.state.transformation.getIn(['args', 'parseFormat']) !== '';
  }

  render() {
    const { column, dataTypeOptions, onClose, onApply } = this.props;
    const { transformation } = this.state;
    const newType = transformation.getIn(['args', 'newType']);
    return (
      <div
        className="DataTableSidebar"
      >
        <SidebarHeader onClose={onClose}>
          Change data type for {column.get('title')}
        </SidebarHeader>
        <div className="inputs">
          <div className="inputGroup">
            <label htmlFor="dataTypeMenu">
              Change data type to:
            </label>
            <SelectMenu
              name="dataTypeMenu"
              value={newType}
              options={dataTypeOptions}
              onChange={(type) => {
                if (type === 'date') {
                  this.mergeArgs({ newType: 'date', parseFormat: 'YYYY-MM-DD' });
                }
                this.mergeArgs({ newType: type });
              }}
            />
          </div>
          {newType === 'date' && column.get('type') === 'text' ?
            <DateFormatSelect
              onChange={parseFormat => this.mergeArgs({ parseFormat })}
            /> : null}
          <div className="inputGroup">
            <label htmlFor="ifInvalidInput">
              If cell format is invalid:
            </label>
            <SelectMenu
              name="dataTypeMenu"
              value={this.state.errorStrategy}
              options={errorOptions}
              onChange={this.handleChangeErrorStrategy}
            />
          </div>
          {this.state.errorStrategy === 'default-value' ?
            <DefaultValueInput
              defaultValue={transformation.getIn(['args', 'defaultValue'])}
              newType={newType}
              onChange={defaultValue => this.mergeArgs({ defaultValue })}
            /> : null}
        </div>
        <SidebarControls
          onApply={this.isValidTransformation() ? () => onApply(transformation) : null}
          onClose={onClose}
        />
      </div>
    );
  }
}

ChangeDataType.propTypes = {
  column: PropTypes.object.isRequired,
  dataTypeOptions: PropTypes.array.isRequired,
  newColumnType: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
};
