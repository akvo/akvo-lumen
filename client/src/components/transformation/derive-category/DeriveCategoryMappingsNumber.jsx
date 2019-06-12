/* eslint-disable jsx-a11y/anchor-has-content */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Col, Container, Row } from 'react-grid-system';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';
import immutable from 'immutable';
import RowLogicRule from './RowLogicRule';
import EmptyRowLogicRule from './EmptyRowLogicRule';
import './DeriveCategoryMappingsText.scss';
import ContextMenu from '../../common/ContextMenu';


class DeriveCategoryMappings extends Component {

  static defaultProps = {
    mappings: [],
    onChange: () => {},
  }

  static propTypes = {
    intl: intlShape,
    mappings: PropTypes.array,
    duplicatedCategoryNames: PropTypes.array,
    onChange: PropTypes.func,
    onChangeTargetColumnName: PropTypes.func,
    sourceColumnIndex: PropTypes.number,
    dataset: PropTypes.object.isRequired,
    onReselectSourceColumn: PropTypes.func,
    onChangeUncategorizedValue: PropTypes.func,
    derivedColumnName: PropTypes.string,
    uncategorizedValue: PropTypes.string,
  }

  constructor(props) {
    super(props);
    this.onUpdateOpRule = this.onUpdateOpRule.bind(this);
    this.onUpdateCategoryRule = this.onUpdateCategoryRule.bind(this);
    this.onAddRule = this.onAddRule.bind(this);
    this.onRemoveRule = this.onRemoveRule.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  state = {
    search: '',
    sort: 'numeric',
    showSourceColumnContextMenu: false,
    rules: immutable.fromJS([]),
  }

  componentDidMount() {
    if (this.derivedColumnTitleInput) {
      this.derivedColumnTitleInput.focus();
    }
  }
  onAddRule() {
    const rules = this.state.rules.push(immutable.fromJS(this.newRule()));
    this.setState({ rules });
    this.onChange(rules);
  }
  onRemoveRule(idx) {
    const rules = this.state.rules.delete(idx);
    this.setState({ rules });
    this.onChange(rules);
  }

  onUpdateOpRule(idx, n, a, b) {
    const rules = this.state.rules.updateIn([idx, n],
      o => o.merge({ op: a, opValue: b }));
    this.setState({ rules });
    this.onChange(rules);
  }

  onUpdateCategoryRule(idx, a) {
    const rules = this.state.rules.setIn([idx, 2], a);
    this.setState({ rules });
    this.onChange(rules);
  }

  onChange(rules) {
    const mappings = rules.map((a) => {
      const r1 = a.get(0);
      const r2 = a.get(1);
      const a2 = r2.get('op') && r2.get('opValue') ? [r2.get('op'), Number(r2.get('opValue'))] : null;
      return [[r1.get('op'), Number(r1.get('opValue'))], a2, a.get(2)];
    });
    this.props.onChange(mappings.toJS());
  }

  newRule() {
    return [{
      op: null,
      opValue: null,
    }, {
      op: null,
      opValue: null,
    }];
  }

  range(start, count) {
    return Array.apply(0, Array(count))
      .map((element, index) => index + start);
  }

  render() {
    const {
      dataset,
      mappings,
      sourceColumnIndex,
      onReselectSourceColumn,
      derivedColumnName,
      onChangeTargetColumnName,
      onChangeUncategorizedValue,
      uncategorizedValue,
      intl,
      duplicatedCategoryNames,
    } = this.props;

    const rules = this.state.rules;

    if (!dataset.sortedValues) return null;

    const { uniques, max, min } = dataset.sortedValues;

    const uncategorizedValueIsInvalid = duplicatedCategoryNames.includes(uncategorizedValue);
    return (
      <Container className="DeriveCategoryMappings container">
        <Row className="DeriveCategoryMapping DeriveCategoryMapping--lg">
          <Col xs={7} className="DeriveCategoryMapping__text">
            <FormattedMessage id="source_column" />: {dataset.columns[sourceColumnIndex].title}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <a
                className="fa fa-ellipsis-v"
                onClick={() => {
                  this.setState({
                    showSourceColumnContextMenu: !this.state.showSourceColumnContextMenu,
                  });
                }}
              />
              {this.state.showSourceColumnContextMenu && (
                <ContextMenu
                  onOptionSelected={(optionValue) => {
                    if (optionValue === 'reselect_source_column') {
                      onReselectSourceColumn();
                    }
                  }}
                  options={[
                    {
                      label: <FormattedMessage id="reselect_source_column" />,
                      value: 'reselect_source_column',
                    },
                  ]}
                />
              )}
            </div>
          </Col>
          <Col xs={5} className="DeriveCategoryMapping__input-wrap">
            <input
              ref={(c) => {
                this.derivedColumnTitleInput = c;
              }}
              value={derivedColumnName}
              placeholder={intl.formatMessage({ id: 'derived_column_title' })}
              onChange={(event) => {
                onChangeTargetColumnName(event.target.value);
              }}
            />
          </Col>
        </Row>

        <Row className="DeriveCategoryMapping DeriveCategoryMeta">
          <Col xs={7} className="DeriveCategoryMapping__text">
            <span>
              <FormattedMessage
                id="unique_values_count"
                values={{ count: uniques }}
              />
              <FormattedMessage
                id="min_value"
                values={{ val: min }}
              />
              <FormattedMessage
                id="max_value"
                values={{ val: max }}
              />
            </span>
          </Col>
          <Col xs={5} className="DeriveCategoryMapping__text">
            <FormattedMessage
              id="categories_count"
              values={{ count: mappings.length }}
            />
          </Col>
        </Row>
        {rules.size > 0 ? this.range(0, rules.size).map(x =>
          (
            <RowLogicRule
              key={x}
              path={x}
              intl={intl}
              onRemoveRule={this.onRemoveRule}
              onUpdateOpRule={this.onUpdateOpRule}
              onUpdateCategoryRule={this.onUpdateCategoryRule}
              rule={rules.getIn([x, 0]).toObject()}
              rule2={rules.getIn([x, 1]).toObject()}
              category={rules.getIn([x, 2])}
            />
          )) : '' }
        <EmptyRowLogicRule onAddRule={this.onAddRule} />
        <Row className={`DeriveCategoryMapping ${uncategorizedValueIsInvalid ? 'DeriveCategoryMapping--invalid' : ''}`}>
          <Col xs={7} className="DeriveCategoryMapping__text">
            <FormattedMessage id="uncategorized_values" />
          </Col>

          <Col xs={5} className="DeriveCategoryMapping__input-wrap">
            <input
              value={uncategorizedValue || ''}
              onChange={(event) => {
                onChangeUncategorizedValue(event.target.value);
              }}
              title={uncategorizedValueIsInvalid ? intl.formatMessage({ id: 'categories_must_be_unique' }) : undefined}
            />
          </Col>
        </Row>
      </Container>
    );
  }
}

export default injectIntl(DeriveCategoryMappings);
