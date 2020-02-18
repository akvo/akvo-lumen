import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import Immutable from 'immutable';
import SelectMenu from '../../common/SelectMenu';
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

  UNSAFE_componentWillMount() {
    this.setState({
      transformation: Immutable.fromJS({
        op: 'core/filter-column',
        args: {
          columnName: this.props.column.get('columnName'),
          columnTitle: this.props.column.get('title'),
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
      >
        <SidebarHeader onClose={onClose}>
          <FormattedMessage id="filter_column" values={{ title: column.get('title') }} />
        </SidebarHeader>
        <div className="inputs">
          <div className="inputGroup">
            <label
              htmlFor="filterTypeMenu"
            >
              <FormattedMessage id="show_rows_whose" />
            </label>
            <SelectMenu
              name="filterTypeMenu"
              value={expressionOperator}
              onChange={this.handleChangeExpressionOperator}
              options={[
                {
                  label: <FormattedMessage id="value_contains" />,
                  value: 'contains',
                },
                {
                  label: <FormattedMessage id="value_is" />,
                  value: 'is',
                },
              ]}
            />
          </div>
          <div className="inputGroup">
            <label
              htmlFor="filterTextInput"
            >
              <FormattedMessage id="filter_text" />
            </label>
            <input
              value={expressionValue}
              type="text"
              className="filterTextInput"
              onChange={event => this.handleChangeExpressionValue(event.target.value)}
            />
          </div>
        </div>
        <SidebarControls
          positiveButtonText={<FormattedMessage id="filter" />}
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
