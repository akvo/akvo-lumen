import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './DeriveCategoryMapping.scss';

export default class DeriveCategoryMapping extends Component {

  static propTypes = {
    sourceValues: PropTypes.array,
    unassignedValues: PropTypes.array,
    targetCategoryName: PropTypes.string,
    onChangeCategoryName: PropTypes.func,
    onSourceValuesUpdate: PropTypes.func,
    onToggleGrouping: PropTypes.func,
    isGrouping: PropTypes.bool,
  }

  state = { search: '' }

  render() {
    const {
      sourceValues,
      targetCategoryName,
      unassignedValues,
      onChangeCategoryName,
      onSourceValuesUpdate,
      onToggleGrouping,
      isGrouping,
    } = this.props;
    const { search } = this.state;

    const searchedValues = unassignedValues.filter(value =>
      (!search.length || value.toLowerCase().indexOf(search.toLowerCase()) > -1)
    );

    return (
      <div className="DeriveCategoryMapping">
        {isGrouping ? (
          <div className="DeriveCategoryMapping__group">
            <input
              placeholder="Search..."
              value={search}
              onChange={(event) => {
                this.setState({ search: event.target.value });
              }}
            />
            already grouped:
            <ul>
              {sourceValues.map(value => (
                <a
                  key={value}
                  onClick={() => {
                    if (sourceValues.length === 1) return;
                    if (sourceValues[0] === value) {
                      onToggleGrouping(sourceValues[1]);
                    }
                    onSourceValuesUpdate(sourceValues, sourceValues.filter(v => v !== value));
                  }}
                >
                  {value}
                </a>
              ))}
            </ul>
            <br />
            available to group:
            <ul>
              {searchedValues.filter(value => !sourceValues.includes(value)).map(value => (
                <a
                  key={value}
                  onClick={() => {
                    onSourceValuesUpdate(sourceValues, [...sourceValues, value]);
                  }}
                >
                  {value}
                </a>
              ))}
            </ul>
          </div>
        ) : sourceValues}
        <a
          onClick={() => {
            onToggleGrouping(isGrouping ? null : sourceValues[0]);
          }}
        >
          Group
        </a>
        <input
          value={targetCategoryName || ''}
          onChange={onChangeCategoryName}
        />
      </div>
    );
  }
}
