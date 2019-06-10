import React from 'react';
import PropTypes from 'prop-types';
import { Col, Row } from 'react-grid-system';

function EmptyRowLogicRule({ onAddRule }) {
  // eslint-disable-line no-unused-vars
  return (
    <Row className="DeriveCategoryMapping">
      <Col xs={12} className="DeriveCategoryMapping__text" >
        <div onClick={onAddRule}>Define new category</div>
      </Col>
    </Row>
  );
}

EmptyRowLogicRule.propTypes = {
  onAddRule: PropTypes.func,
};


export default EmptyRowLogicRule;
