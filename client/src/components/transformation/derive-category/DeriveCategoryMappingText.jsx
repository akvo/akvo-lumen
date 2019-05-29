/* eslint-disable jsx-a11y/anchor-has-content */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Row, Col } from 'react-grid-system';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';
import { uniqBy, sortBy } from 'lodash';

import './DeriveCategoryMappingText.scss';
import Popover from '../../common/Popover';
import Button from '../../common/Button';
import ClickAway from '../../common/ClickAway';

const SEARCH_RESULTS_LIMIT = 10;

class DeriveCategoryMapping extends Component {

  static propTypes = {
    sourceValues: PropTypes.array,
    unassignedValues: PropTypes.array,
    targetCategoryName: PropTypes.string,
    onChangeCategoryName: PropTypes.func,
    onSourceValuesUpdate: PropTypes.func,
    onToggleGrouping: PropTypes.func,
    isGrouping: PropTypes.bool,
    isInvalid: PropTypes.bool,
    intl: intlShape,
  }

  constructor(props) {
    super(props);
    this.handleSelectAll = this.handleSelectAll.bind(this);
  }

  state = { search: '' }

  getSearchResults() {
    const { unassignedValues } = this.props;
    const { search } = this.state;

    return sortBy(
      // eslint-disable-next-line no-unused-vars
      unassignedValues.filter(([count, value]) =>
        (!search.length || `${value}`.toLowerCase().indexOf(search.toLowerCase()) > -1)
      ).slice(0, SEARCH_RESULTS_LIMIT),
     // eslint-disable-next-line no-unused-vars
      ([count, value]) => value.toLowerCase()
    );
  }

  handleSelectAll(event) {
    const { checked } = event.target;
    const {
      sourceValues,
      onSourceValuesUpdate,
    } = this.props;

    if (checked) {
      const searchResults = this.getSearchResults();
      onSourceValuesUpdate(
        sourceValues,
        uniqBy(
          [...sourceValues, ...searchResults],
          // eslint-disable-next-line no-unused-vars
          ([count, value]) => value
        )
      );
    } else {
      onSourceValuesUpdate(sourceValues, [sourceValues[0]]);
    }
  }


  render() {
    const {
      sourceValues,
      targetCategoryName,
      onChangeCategoryName,
      onSourceValuesUpdate,
      onToggleGrouping,
      isGrouping,
      isInvalid,
      intl,
    } = this.props;
    const { search } = this.state;
    const searchResults = this.getSearchResults();

    return (
      <Row className={`DeriveCategoryMapping ${isInvalid ? 'DeriveCategoryMapping--invalid' : ''}`}>

        {isGrouping && (
          <ClickAway
            onClickAway={() => {
              onToggleGrouping(null);
            }}
          >
            <Popover
              title={(
                <div>
                  <FormattedMessage id="select_values_to_group" />
                  <a
                    onClick={() => {
                      onToggleGrouping(null);
                    }}
                    className="fa fa-close"
                  />
                </div>
              )}
              footer={(
                <Row>
                  <Col xs={6}>
                    <input
                      type="checkbox"
                      id="select-all-checkbox"
                      onChange={this.handleSelectAll}
                    />
                    <label htmlFor="select-all-checkbox">
                      <FormattedMessage id="select_all" />
                    </label>
                  </Col>
                  <Col xs={6} className="text-right">
                    <Button>
                      <FormattedMessage id="close" />
                    </Button>
                  </Col>
                </Row>
              )}
              placement="bottom-right"
              left={30}
              top={50}
            >
              <input
                placeholder="Search..."
                className="DeriveCategoryMappings__search-input"
                value={search}
                onChange={(event) => {
                  this.setState({ search: event.target.value });
                }}
              />
              <ul className="DeriveCategoryMappings__list">
                {(sourceValues.length > 1) && sourceValues.slice(1).map(([count, value]) => (
                  <li key={value}>
                    <input
                      type="checkbox"
                      checked
                      onChange={() => {
                        onSourceValuesUpdate(
                          sourceValues,
                          // eslint-disable-next-line no-unused-vars
                          sourceValues.filter(([c, v]) => v !== value)
                        );
                      }}
                    />
                    {value} ({count})
                  </li>
                ))}

                {searchResults
                 // eslint-disable-next-line no-unused-vars
                  .filter(([count, value]) => !sourceValues.map(([c, v]) => v).includes(value))
                  .map(([count, value]) => (
                    <li key={value}>
                      <input
                        type="checkbox"
                        onChange={() => {
                          onSourceValuesUpdate(sourceValues, [...sourceValues, [count, value]]);
                        }}
                      />
                      {value} ({count})
                    </li>
                  ))
                }
              </ul>
            </Popover>
          </ClickAway>
        )}

        <Col xs={7} className="DeriveCategoryMapping__text">
          {sourceValues.map(([count, value]) => `${value} (${count})`).join(', ')}

          <a
            onClick={() => {
              onToggleGrouping(isGrouping ? null : sourceValues[0][1]);
            }}
            className="DeriveCategoryMapping__action_btn"
          >
            <FormattedMessage id="group" />
          </a>
        </Col>

        <Col xs={5} className="DeriveCategoryMapping__input-wrap">
          <input
            value={targetCategoryName || ''}
            onChange={onChangeCategoryName}
            title={isInvalid ? intl.formatMessage({ id: 'categories_must_be_unique' }) : undefined}
          />
        </Col>
      </Row>
    );
  }
}

export default injectIntl(DeriveCategoryMapping);
