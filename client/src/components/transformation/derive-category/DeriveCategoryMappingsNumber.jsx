/* eslint-disable jsx-a11y/anchor-has-content */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Col, Container, Row } from 'react-grid-system';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';
import immutable from 'immutable';
import LogicRule from './LogicRule';
import './DeriveCategoryMappingsNumber.scss';
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
    this.handleTargetCategoryNameUpdate = this.handleTargetCategoryNameUpdate.bind(this);
    this.handleSourceValuesUpdate = this.handleSourceValuesUpdate.bind(this);
    this.onUpdateOpRule = this.onUpdateOpRule.bind(this);
    this.onUpdateCategoryRule = this.onUpdateCategoryRule.bind(this);
  }

  state = {
    search: '',
    sort: 'numeric',
    showSourceColumnContextMenu: false,
    rules: immutable.fromJS([[{
      op: null,
      opValue: null,
    }, {
      op: null,
      opValue: null,
    }]]),
  }
  componentDidMount() {
    if (this.derivedColumnTitleInput) {
      this.derivedColumnTitleInput.focus();
    }
  }

  onUpdateOpRule(n, a, b) {
    this.setState({ rules: this.state.rules.updateIn([0, n],
      o => o.merge({ op: a, opValue: b })) });
  }
  onUpdateCategoryRule(a) {
    this.setState({ rules: this.state.rules.setIn([0, 2], a) });
  }

  handleTargetCategoryNameUpdate(sourceValues, targetCategoryName) {
    const { onChange, mappings } = this.props;
    const existingMappingIndex = this.getExistingMappingIndex(sourceValues[0][1]);
    const newMappings = [...mappings];
    if (existingMappingIndex > -1) {
      newMappings[existingMappingIndex][1] = targetCategoryName;
    } else {
      newMappings.push([
        sourceValues,
        targetCategoryName,
      ]);
    }
    onChange(newMappings);
  }

  handleSourceValuesUpdate(currentSourceValues, nextSourceValues) {
    const { onChange, mappings } = this.props;
    const existingMappingIndex = this.getExistingMappingIndex(currentSourceValues[0][1]);
    const newMappings = [...mappings];
    if (existingMappingIndex > -1) {
      if (nextSourceValues.length === 1 && !newMappings[existingMappingIndex][1]) {
        newMappings.splice(existingMappingIndex, 1);
      } else {
        newMappings[existingMappingIndex][0] = nextSourceValues;
      }
    } else {
      newMappings.push([
        nextSourceValues,
      ]);
    }
    onChange(newMappings);
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

    const rule = this.state.rules.getIn([0, 0]);
    console.log('rule', JSON.stringify(rule));
    const cat = this.state.rules.getIn([0, 2]);
    console.log('r', JSON.stringify(this.state.rules.get(0)));
    const rule2 = this.state.rules.getIn([0, 1]);

    if (!dataset.sortedValues) return null;

    const { uniques, max, min } = dataset.sortedValues;
//    console.log('dataset.sortedValues', all, uniques, max, min);
//    console.log(this.props);

    /*

    const unassignedValues = dataset.sortedValues
      // eslint-disable-next-line no-unused-vars
      .filter(([count, value]) => this.getExistingMappingIndex(value) === -1);

    let searchedValues = sortBy(
      unassignedValues
        // eslint-disable-next-line no-unused-vars
        .filter(([count, value]) =>
          (!search.length || `${value}`.toLowerCase().indexOf(search.toLowerCase()) > -1)
        ),
      ([count, value]) => (sort === 'numeric' ? count : value.toLowerCase())
    );

    if (sort === 'numeric') {
      searchedValues = searchedValues.reverse();
    }

    searchedValues = searchedValues.slice(0, MAPPING_COUNT_LIMIT);

    const potentialMappings = mappings.concat(searchedValues.map(value => [[value]]));
    */
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
              MIN: { min }. MAX: { max }
            </span>
          </Col>
          <Col xs={5} className="DeriveCategoryMapping__text">
            <FormattedMessage
              id="categories_count"
              values={{ count: mappings.length + 1 }}
            />
          </Col>
        </Row>
        <LogicRule
          onUpdateOpRule={this.onUpdateOpRule}
          onUpdateCategoryRule={this.onUpdateCategoryRule}
          rule={rule.toObject()}
          rule2={rule2.toObject()}
          category={cat}
        />
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
