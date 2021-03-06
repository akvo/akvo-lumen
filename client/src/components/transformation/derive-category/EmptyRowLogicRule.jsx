import React from 'react';
import PropTypes from 'prop-types';
import { Col, Row } from 'react-grid-system';
import { FormattedMessage } from 'react-intl';
import './DeriveCategoryMappingText.scss';
import './DeriveCategoryMappingNumber.scss';


function EmptyRowLogicRule({ onAddRule }) {
  // eslint-disable-line no-unused-vars
  return (
    <Row className="DeriveCategoryMapping">
      <Col xs={12} className="DeriveCategoryMapping__text" >
        <a onClick={onAddRule} className="DeriveCategoryMapping__action_btn"><FormattedMessage id="define_new_category" /></a>
      </Col>
    </Row>
  );
}

EmptyRowLogicRule.propTypes = {
  onAddRule: PropTypes.func,
};


export default EmptyRowLogicRule;
