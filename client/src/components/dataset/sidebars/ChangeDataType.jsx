import React, { Component, PropTypes } from 'react';
import DashSelect from '../../common/DashSelect';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';

const parseFormatOptions = [
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
];

function DateFormatSelect({ onChange, parseFormat }) {
  return (
    <div className="inputGroup">
      <label htmlFor="parseFormatMenu">
        Date format:
      </label>
      <DashSelect
        name="parseFormatMenu"
        value={parseFormat}
        options={parseFormatOptions}
        onChange={onChange}
      />
    </div>
  );
}

DateFormatSelect.propTypes = {
  parseFormat: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

function DefaultValueInput({ defaultValue, onChange, newType }) {
  return (
    <div className="inputGroup">
      <label htmlFor="defaultValueInput">
        Default value:
      </label>
      <input
        type="text"
        value={defaultValue}
        onChange={(event) => {
          const value = event.target.value;
          if (newType === 'date') {
            const n = parseInt(value, 10);
            if (isNaN(n)) {
              // TODO warn
              onChange(null);
            } else {
              onChange(n);
            }
          } else if (newType === 'number') {
            const n = parseFloat(value);
            if (isNaN(n)) {
              // TODO warn
              onChange(null);
            } else {
              onChange(n);
            }
          } else {
            onChange(value);
          }
        }}
      />
    </div>
  );
}

DefaultValueInput.propTypes = {
  defaultValue: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  newType: PropTypes.oneOf(['date', 'text', 'number']).isRequired,
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
      op: 'core/change-datatype',
      args: {
        columnName: column.columnName,
        newType: newColumnType,
        defaultValue: null,
        parseFormat: 'YYYY-MM-DD',
      },
      onError: 'default-value',
      errorStrategy: 'empty-cell',
    });
  }


  mergeArgs(args) {
    this.setState({ args: Object.assign({}, this.state.args, args) });
  }

  handleChangeErrorStrategy(errorStrategy) {
    switch (errorStrategy) {
      case 'emptyCell': {
        const args = Object.assign({}, this.state.args, { defaultValue: null });
        this.setState({
          args,
          onError: 'default-value',
          errorStrategy,
        });
        break;
      }
      case 'default-value':
      case 'fail':
      case 'delete-row': {
        this.setState({
          onError: errorStrategy,
          errorStrategy,
        });
        break;
      }
      default:
        throw new Error(`Unkown error strategy ${errorStrategy}`);
    }
  }

  render() {
    const { column, dataTypeOptions, onClose, onApply } = this.props;
    const { newType } = this.state.args;
    return (
      <div
        className="DataTableSidebar"
        style={{
          width: '300px',
          height: 'calc(100vh - 4rem)',
        }}
      >
        <SidebarHeader onClose={onClose}>
          Change data type for {column.title}
        </SidebarHeader>
        <div className="inputs">
          <div className="inputGroup">
            <label htmlFor="dataTypeMenu">
              Change data type to:
            </label>
            <DashSelect
              name="dataTypeMenu"
              value={newType}
              options={dataTypeOptions}
              onChange={type => {
                if (type === 'date') {
                  this.mergeArgs({ newType: 'date', parseFormat: 'YYYY-MM-DD' });
                }
                this.mergeArgs({ newType: type });
              }}
            />
          </div>
          {newType === 'date' && column.type === 'text' ?
            <DateFormatSelect
              parseFormat={this.state.args.parseFormat}
              onChange={parseFormat => this.mergeArgs({ parseFormat })}
            /> : null}
          <div className="inputGroup">
            <label htmlFor="ifInvalidInput">
              If cell format is invalid:
            </label>
            <DashSelect
              name="dataTypeMenu"
              value={this.state.errorStrategy}
              options={errorOptions}
              onChange={this.handleChangeErrorStrategy}
            />
          </div>
          {this.state.errorStrategy === 'default-value' ?
            <DefaultValueInput
              defaultValue={this.state.args.defaultValue}
              newType={newType}
              onChange={defaultValue => this.mergeArgs({ defaultValue })}
            /> : null}
        </div>
        <SidebarControls
          onApply={() => onApply(this.state)}
          onClose={onClose}
        />
      </div>
    );
  }
}

ChangeDataType.propTypes = {
  column: PropTypes.shape({
    title: PropTypes.string.isRequired,
  }).isRequired,
  dataTypeOptions: PropTypes.array.isRequired,
  newColumnType: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
};
