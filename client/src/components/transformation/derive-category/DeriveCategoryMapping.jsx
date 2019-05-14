/* eslint-disable jsx-a11y/anchor-has-content */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Row, Col } from 'react-grid-system';

import './DeriveCategoryMapping.scss';
import Popover from '../../common/Popover';
import ClickAway from '../../common/ClickAway';

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
      (!search.length || `${value}`.toLowerCase().indexOf(search.toLowerCase()) > -1)
    );

    return (
      <Row className="DeriveCategoryMapping">

        {isGrouping && (
          <ClickAway
            onClickAway={() => {
              onToggleGrouping(null);
            }}
          >
            <Popover
              // className="DeriveCategoryMapping__group"
              title={(
                <div>
                  <h4>Select values to group</h4>
                  <input
                    placeholder="Search..."
                    value={search}
                    onChange={(event) => {
                      this.setState({ search: event.target.value });
                    }}
                  />
                </div>
              )}
              placement="bottom-right"
              left={30}
              top={50}
            >
              {(sourceValues.length > 1) && sourceValues.map(value => (
                <div
                  className="DeriveCategoryMapping__tag DeriveCategoryMapping__tag--with-btn"
                  key={value}
                >
                  {value}
                  <a
                    className="DeriveCategoryMapping__tag__btn fa fa-close"
                    onClick={() => {
                      onSourceValuesUpdate(sourceValues, sourceValues.filter(v => v !== value));
                    }}
                  />
                </div>
              ))}

              <div>
                {searchedValues.filter(value => !sourceValues.includes(value)).map(value => (
                  <a
                    key={value}
                    onClick={() => {
                      onSourceValuesUpdate(sourceValues, [...sourceValues, value]);
                    }}
                    className="DeriveCategoryMapping__tag DeriveCategoryMapping__tag"
                  >
                    {value}
                  </a>
                ))}
              </div>
            </Popover>
          </ClickAway>
        )}

        <Col xs={6}>
          {sourceValues.join(', ')}

          <a
            onClick={() => {
              onToggleGrouping(isGrouping ? null : sourceValues[0]);
            }}
            className="DeriveCategoryMapping__action_btn"
          >
            Group
          </a>
        </Col>

        <Col xs={6}>
          <input
            value={targetCategoryName || ''}
            onChange={onChangeCategoryName}
          />
        </Col>
      </Row>
    );
  }
}
