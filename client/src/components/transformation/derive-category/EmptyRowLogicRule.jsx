import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Col, Row } from 'react-grid-system';

export default class EmptyRowLogicRule extends Component {

  static propTypes = {
    onAddRule: PropTypes.func,
  }

  render() {
    const { onAddRule } = this.props;
    // eslint-disable-line no-unused-vars
    return (
      <Row className="DeriveCategoryMapping">
        <Col xs={12} className="DeriveCategoryMapping__text" >
          <div onClick={onAddRule}>Define new category</div>
        </Col>
      </Row>
    );
  }
}
