/* eslint-disable jsx-a11y/anchor-has-content */
import { findIndex, sortBy } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Col, Container, Row } from 'react-grid-system';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';

import DeriveCategoryMapping from './DeriveCategoryMappingText';
import './DeriveCategoryMappingsText.scss';
import ContextMenu from '../../common/ContextMenu';

const MAPPING_COUNT_LIMIT = 50;

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
  }

  state = {
    search: '',
    sort: 'numeric',
    showSourceColumnContextMenu: false,
  }

  componentDidMount() {
    if (this.derivedColumnTitleInput) {
      this.derivedColumnTitleInput.focus();
    }
  }

  getExistingMappingIndex(value) {
    const { mappings } = this.props;
    return findIndex(mappings, ([sourceValues]) =>
      // eslint-disable-next-line no-unused-vars
      sourceValues.map(([c, v]) => v).includes(value)
    );
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
    const { search, sort } = this.state;
    const { counter, max, min } = dataset.sortedValues;
    console.log('dataset.sortedValues', counter, max, min);
    console.log(this.props);

    if (!dataset.sortedValues) return null;
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

        {/* <Row className="DeriveCategoryMapping DeriveCategoryMeta">
          <Col xs={7} className="DeriveCategoryMapping__text">
            <span>
              <FormattedMessage
                id="unique_values_count"
                values={{ count: dataset.sortedValues.length }}
              />
            </span>
            <a
              className={`fa fa-sort-numeric-desc DeriveCategoryMapping__sort-btn ${sort === 'numeric' ? 'DeriveCategoryMapping__sort-btn--selected' : ''}`}
              onClick={() => {
                this.setState({ sort: 'numeric' });
              }}
            />
            <a
              className={`fa fa-sort-alpha-desc DeriveCategoryMapping__sort-btn ${sort === 'alpha' ? 'DeriveCategoryMapping__sort-btn--selected' : ''}`}
              onClick={() => {
                this.setState({ sort: 'alpha' });
              }}
            />
            <input
              placeholder="Search..."
              className="DeriveCategoryMappings__search-input"
              value={search}
              onChange={(event) => {
                this.setState({ search: event.target.value });
              }}
            />
          </Col>
          <Col xs={5} className="DeriveCategoryMapping__text">
            <FormattedMessage
              id="categories_count"
              values={{ count: mappings.length + 1 }}
            />
          </Col>
        </Row> */}

        {/* potentialMappings.map(([sourceValues, targetCategoryName]) => (
          <DeriveCategoryMapping
            key={sourceValues[0][1]}
            unassignedValues={unassignedValues}
            sourceValues={sourceValues}
            targetCategoryName={targetCategoryName}
            onChangeCategoryName={(event) => {
              this.handleTargetCategoryNameUpdate(sourceValues, event.target.value);
            }}
            onSourceValuesUpdate={this.handleSourceValuesUpdate}
            isGrouping={
              // eslint-disable-next-line no-unused-vars
              sourceValues.map(([count, value]) => value).includes(this.state.isGroupingValue)
            }
            onToggleGrouping={(isGroupingValue) => {
              this.setState({ isGroupingValue });
            }}
            isInvalid={duplicatedCategoryNames.includes(targetCategoryName)}
          />
          )) */}

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
