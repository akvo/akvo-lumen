import React, { Component, PropTypes } from 'react';
import SelectInput from './SelectInput';
import Subtitle from './Subtitle';
import UniqueValueMenu from './UniqueValueMenu';

export default class PivotTableConfigMenu extends Component {

  constructor() {
    super();
    this.state = {
      catValMenuCollapsed: true,
      rowValMenuCollapsed: true,
    };
  }

  render() {
    const {
      visualisation,
      onChangeSpec,
      columnOptions,
      aggregationOptions,
    } = this.props;
    const spec = visualisation.spec;

    return (
      <div>
        <hr />
        <Subtitle>Aggregation</Subtitle>
        <SelectInput
          placeholder="Select aggregation method"
          labelText="Aggregation method"
          choice={spec.aggregation !== null ? spec.aggregation.toString() : null}
          name="aggregationMethod"
          options={aggregationOptions}
          onChange={(value) => {
            const change = { aggregation: value };

            if (value === 'count') {
              change.valueColumn = null;
            }

            onChangeSpec(change);
          }}
        />
        {spec.aggregation !== 'count' &&
          <SelectInput
            placeholder="Select a value column"
            labelText="Value column"
            choice={spec.valueColumn !== null ? spec.valueColumn.toString() : null}
            name="valueColumnInput"
            options={columnOptions}
            onChange={value => onChangeSpec({
              valueColumn: value,
            })}
            clearable
          />
        }
        <hr />
        <Subtitle>Categories</Subtitle>
        <SelectInput
          placeholder="Select a category column"
          labelText="Category column"
          choice={spec.categoryColumn !== null ? spec.categoryColumn.toString() : null}
          name="categoryColumnInput"
          options={columnOptions}
          onChange={value => onChangeSpec({
            categoryColumn: value,
          })}
          clearable
        />
        {spec.categoryColumn !== null &&
          <UniqueValueMenu
            tableData={visualisation.data}
            dimension="category"
            collapsed={this.state.catValMenuCollapsed}
            onChangeSpec={this.props.onChangeSpec}
            column={spec.categoryColumn}
            filters={spec.filters}
            toggleCollapsed={() =>
              this.setState({ catValMenuCollapsed: !this.state.catValMenuCollapsed })
            }
          />
        }
        <hr />
        <Subtitle>Rows</Subtitle>
        <SelectInput
          placeholder="Select a row column"
          labelText="Row column"
          choice={spec.rowColumn !== null ? spec.rowColumn.toString() : null}
          name="rowColumnInput"
          options={columnOptions}
          onChange={value => onChangeSpec({
            rowColumn: value,
          })}
          clearable
        />
      </div>
    );
  }
}

PivotTableConfigMenu.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
  columnOptions: PropTypes.array.isRequired,
  aggregationOptions: PropTypes.array.isRequired,
  getColumnMetadata: PropTypes.func.isRequired,
};
