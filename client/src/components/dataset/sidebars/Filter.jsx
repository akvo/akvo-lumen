import React, { Component, PropTypes } from 'react';
import Immutable from 'immutable';
import DashSelect from '../../common/DashSelect';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';

function getExpressionOperatorAndValue(expression) {
  return expression.entrySeq().first();
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
      transformation: Immutable.fromJS({
        op: 'core/filter-column',
        args: {
          columnName: this.props.column.get('columnName'),
          expression: { is: '' },
        },
        onError: 'fail',
      }),
    });
  }

  handleChangeExpressionValue(expressionValue) {
    const { transformation } = this.state;
    const expression = transformation.getIn(['args', 'expression']);
    const expressionOperator = expression.keySeq().first();
    this.setState({
      transformation: transformation.setIn(
        ['args', 'expression', expressionOperator], expressionValue
      ),
    });
  }

  handleChangeExpressionOperator(expressionOperator) {
    const { transformation } = this.state;
    const expressionValue = transformation.getIn(['args', 'expression']).valueSeq().first();
    this.setState({
      transformation: transformation.setIn(
        ['args', 'expression'], Immutable.Map({ [expressionOperator]: expressionValue })),
    });
  }

  render() {
    const { onClose, onApply, column } = this.props;
    const { transformation } = this.state;
    const [expressionOperator, expressionValue] =
      getExpressionOperatorAndValue(transformation.getIn(['args', 'expression']));
    return (
      <div
        className="DataTableSidebar"
        style={{
          width: '300px',
          height: 'calc(100vh - 4rem)',
        }}
      >
        <SidebarHeader onClose={onClose}>
          Filter column {column.get('title')}
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
              onChange={(event) => this.handleChangeExpressionValue(event.target.value)}
            />
          </div>
        </div>
        <SidebarControls
          positiveButtonText="Filter"
          onApply={() => onApply(transformation)}
          onClose={onClose}
        />
      </div>
    );
  }
}

Filter.propTypes = {
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  column: PropTypes.object.isRequired,
};
