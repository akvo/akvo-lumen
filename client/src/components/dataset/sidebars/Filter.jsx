import React, { Component, PropTypes } from 'react';
import DashSelect from '../../common/DashSelect';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';

function getExpressionOperatorAndValue(expression) {
  const expressionOperator = Object.keys(expression)[0];
  return [expressionOperator, expression[expressionOperator]];
}

export default class Filter extends Component {
  constructor() {
    super();
    this.state = {};
    this.handleChangeExpressionValue = this.handleChangeExpressionValue.bind(this);
    this.handleChangeExpressionOperator = this.handleChangeExpressionOperator.bind(this);
  }

  componentWillMount() {
    this.setState({
      op: 'core/filter-column',
      args: {
        columnName: this.props.column.columnName,
        expression: { is: '' },
      },
      onError: 'fail',
    });
  }

  handleChangeExpressionValue(expressionValue) {
    const { args } = this.state;
    const [currentExpressionOperator] = getExpressionOperatorAndValue(args.expression);
    const newArgs = Object.assign({}, args, {
      expression: {
        [currentExpressionOperator]: expressionValue,
      },
    });
    this.setState(Object.assign({}, this.state, { args: newArgs }));
  }

  handleChangeExpressionOperator(expressionOperator) {
    const { args } = this.state;
    const currentValue = getExpressionOperatorAndValue(args.expression)[1];
    const newArgs = Object.assign({}, args, {
      expression: {
        [expressionOperator]: currentValue,
      },
    });
    this.setState(Object.assign({}, this.state, { args: newArgs }));
  }

  render() {
    const { onClose, onApply, column } = this.props;
    const { args } = this.state;
    const [expressionOperator, expressionValue] =
      getExpressionOperatorAndValue(args.expression);
    return (
      <div
        className="DataTableSidebar"
        style={{
          width: '300px',
          height: 'calc(100vh - 4rem)',
        }}
      >
        <SidebarHeader onClose={onClose}>
          Filter column {column.title}
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
              value={expressionOperator}
              onChange={this.handleChangeExpressionOperator}
              options={[
                {
                  label: 'Value contains',
                  value: 'contains',
                },
                {
                  label: 'Value is',
                  value: 'is',
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
              value={expressionValue}
              type="text"
              className="filterTextInput"
              ref="filterTextInput"
              onChange={(event) => this.handleChangeExpressionValue(event.target.value)}
            />
          </div>
        </div>
        <SidebarControls
          positiveButtonText="Filter"
          onApply={() => onApply(this.state)}
          onClose={onClose}
        />
      </div>
    );
  }
}

Filter.propTypes = {
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  column: PropTypes.shape({
    columnName: PropTypes.string.isRequired,
  }),
};
