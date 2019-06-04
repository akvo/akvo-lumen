import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Col, Row } from 'react-grid-system';
import ContextMenu from '../../common/ContextMenu';

export default class LogicRule extends Component {

  static propTypes = {
    onUpdateOpRule: PropTypes.func,
    onUpdateCategoryRule: PropTypes.func,
    rule: PropTypes.object,
  }

  constructor(props) {
    super(props);
    this.handleClicking = this.handleClicking.bind(this);
  }

  state = {
    selected: false,
    showConditions: false,
    conditionsValue: '',
    categoryValue: 'Category',
  }
  componentDidMount() {
//    document.body.addEventListener('click', this.handleClickBody);
  }

  componentWillUnmount() {
//    document.body.removeEventListener('click', this.handleClickBody);
  }

  getDict(k) {
    return {
      label: this.dict[k],
      value: k,
      customClass: 'contextMenuItem',
    };
  }

  dict = {
    '<': 'is less than',
    '<=': 'is less or equal to',
    '==': 'is equal to',
    '>=': 'is greater or equal to',
    '>': 'is greater than',
    '': 'Define category',
  }


  handleClicking(e) {
    this.setState({ showConditions: true });
    e.preventDefault();
  }


  render() {
    const { selected, showConditions, conditionsValue, categoryValue } = this.state;

    const { onUpdateOpRule, onUpdateCategoryRule, rule } = this.props;
    // eslint-disable-line no-unused-vars
    return (
      <Row className="DeriveCategoryMapping">
        <Col xs={2} className="DeriveCategoryMapping__text" >
          { showConditions ?
            <ContextMenu
              style={{ left: 0 }}
              onOptionSelected={(op) => {
                console.log(op);
                /*
                if (this.nameInput !== undefined) {
                  this.nameInput.focus();
                }
                */
                this.setState({ selected: true, showConditions: false, conditionsValue: op });
                onUpdateOpRule(op, rule.opValue);
              }}
              options={
              [
                this.getDict('<'),
                this.getDict('<='),
                this.getDict('=='),
                this.getDict('>='),
                this.getDict('>'),
              ]}
            />
            : <div onClick={this.handleClicking}>{this.dict[conditionsValue]}</div>}
        </Col>
        <Col xs={5} className="DeriveCategoryMapping__text" >
          <input
            ref={(input) => { this.nameInput = input; }}
            hidden={!selected}
            value={rule.opValue || ''}
            onChange={(event) => {
              onUpdateOpRule(rule.op, event.target.value);
              console.log(event.target.value);
            }}
            title=""
          />
        </Col>
        <Col xs={5} className="DeriveCategoryMapping__input-wrap">
          <input
            value={rule.category || categoryValue}
            onChange={(event) => {
              console.log(event.target.value);
              onUpdateCategoryRule(event.target.value);
            }}
            title=""
          />
        </Col>
      </Row>
    );
  }
}
