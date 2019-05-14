/* eslint-disable jsx-a11y/anchor-has-content */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { findIndex } from 'lodash';
import { Container, Row, Col } from 'react-grid-system';

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
    derivedColumnName: PropTypes.string,
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
    return findIndex(mappings, ([sourceValues]) => sourceValues.includes(value));
  }

  handleTargetCategoryNameUpdate(sourceValues, targetCategoryName) {
    const { onChange, mappings } = this.props;
    const existingMappingIndex = this.getExistingMappingIndex(sourceValues[0]);
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
    const existingMappingIndex = this.getExistingMappingIndex(currentSourceValues[0]);
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
    } = this.props;
    const { search } = this.state;

    const unassignedValues = dataset.rows
      .map(row => row[sourceColumnIndex])
      .filter(value => this.getExistingMappingIndex(value) === -1);

    const searchedValues = unassignedValues.filter(value =>
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
            isGrouping={sourceValues.includes(this.state.isGroupingValue)}
            onToggleGrouping={(isGroupingValue) => {
              this.setState({ isGroupingValue });
            }}
          />
        ))}
      </Container>
    );
  }
}
