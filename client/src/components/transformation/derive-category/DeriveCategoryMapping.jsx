/* eslint-disable jsx-a11y/anchor-has-content */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Row, Col } from 'react-grid-system';
import { FormattedMessage, injectIntl } from 'react-intl';

import './DeriveCategoryMapping.scss';
import Popover from '../../common/Popover';
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

     // eslint-disable-next-line no-unused-vars
    const searchedValues = unassignedValues.filter(([count, value]) =>
      (!search.length || `${value}`.toLowerCase().indexOf(search.toLowerCase()) > -1)
    ).slice(0, SEARCH_RESULTS_LIMIT);

    return (
      <Row className="DeriveCategoryMapping">

        {isGrouping && (
          <ClickAway
            onClickAway={() => {
              onToggleGrouping(null);
            }}
          >
            <Popover
              title={(
                <div>
                  <p>
                    <FormattedMessage id="select_values_to_group" />
                  </p>
                  <input
                    placeholder="Search..."
                    className="DeriveCategoryMappings__search-input"
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
              {(sourceValues.length > 1) && sourceValues.map(([count, value]) => (
                <div
                  className="DeriveCategoryMapping__tag DeriveCategoryMapping__tag--with-btn DeriveCategoryMapping__tag--active"
                  key={value}
                >
                  {value} ({count})
                  <a
                    className="DeriveCategoryMapping__tag__btn fa fa-close"
                    onClick={() => {
                      onSourceValuesUpdate(
                        sourceValues,
                        // eslint-disable-next-line no-unused-vars
                        sourceValues.filter(([c, v]) => v !== value)
                      );
                    }}
                  />
                </div>
              ))}

              <div>
                {searchedValues
                 // eslint-disable-next-line no-unused-vars
                  .filter(([count, value]) => !sourceValues.map(([c, v]) => v).includes(value))
                  .map(([count, value]) => (
                    <a
                      key={value}
                      onClick={() => {
                        onSourceValuesUpdate(sourceValues, [...sourceValues, [count, value]]);
                      }}
                      className="DeriveCategoryMapping__tag DeriveCategoryMapping__tag"
                    >
                      {value}
                    </a>
                  ))
                }
              </div>
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
          />
        </Col>
      </Row>
    );
  }
}

export default injectIntl(DeriveCategoryMapping);
