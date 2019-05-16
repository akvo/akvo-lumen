/* eslint-disable jsx-a11y/anchor-has-content */
import { findIndex } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Col, Container, Row } from 'react-grid-system';

import DeriveCategoryMapping from './DeriveCategoryMapping';
import './DeriveCategoryMappings.scss';

export default class DeriveCategoryMappings extends Component {

  static defaultProps = {
    mappings: [],
    onChange: () => {},
  }

  static propTypes = {
    mappings: PropTypes.array,
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
    } = this.props;
    const { search } = this.state;

    if (!dataset.sortedValues) return null;

    const unassignedValues = dataset.sortedValues // rows
      // eslint-disable-next-line no-unused-vars
      .filter(([count, value]) => this.getExistingMappingIndex(value) === -1);

    // eslint-disable-next-line no-unused-vars
    const searchedValues = unassignedValues.filter(([count, value]) =>
      (!search.length || `${value}`.toLowerCase().indexOf(search.toLowerCase()) > -1)
    );

    const potentialMappings = mappings.concat(searchedValues.map(value => [[value]]));

    return (
      <Container className="DeriveCategoryMappings container">
        <Row className="DeriveCategoryMappings__row">
          <Col md={6}>
            <a onClick={onReselectSourceColumn}>
              Source column: {dataset.columns[sourceColumnIndex].title}
            </a>
          </Col>
          <Col md={6}>
            <input
              value={derivedColumnName}
              placeholder="target column name"
              onChange={(event) => {
                onChangeTargetColumnName(event.target.value);
              }}
            />
          </Col>
        </Row>
        <Row className="DeriveCategoryMappings__row">
          <Col md={6}>
            6 Unique values
            <a
              className="fa fa-sort-numeric-desc"
              onClick={() => {
                this.setState({ sortBy: 'numeric' });
              }}
            />
            <a
              className="fa fa-sort-alpha-desc"
              onClick={() => {
                this.setState({ sortBy: 'alpha' });
              }}
            />
            <input
              placeholder="Search..."
              value={search}
              onChange={(event) => {
                this.setState({ search: event.target.value });
              }}
            />
          </Col>
          <Col md={6}>
            6 categories
          </Col>
        </Row>

        {potentialMappings.map(([sourceValues, targetCategoryName], i) => (
          <DeriveCategoryMapping
            key={i}
            unassignedValues={unassignedValues}
            sourceValues={sourceValues}
            targetCategoryName={targetCategoryName}
            onChangeCategoryName={(event) => {
              this.handleTargetCategoryNameUpdate(sourceValues, event.target.value);
            }}
            onSourceValuesUpdate={this.handleSourceValuesUpdate}
            // eslint-disable-next-line no-unused-vars
            isGrouping={sourceValues.map(([count, value]) => value).includes(this.state.isGroupingValue)}
            onToggleGrouping={(isGroupingValue) => {
              this.setState({ isGroupingValue });
            }}
          />
        ))}

        <Row className="DeriveCategoryMappings__row">
          <Col xs={6}>
            Uncategorized Values
          </Col>

          <Col xs={6}>
            <input
              value={uncategorizedValue || ''}
              onChange={(event) => {
                onChangeUncategorizedValue(event.target.value);
              }}
            />
          </Col>
        </Row>
      </Container>
    );
  }
}
