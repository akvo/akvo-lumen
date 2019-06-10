/* eslint-disable jsx-a11y/anchor-has-content */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Col, Row } from 'react-grid-system';
import ContextMenu from '../../common/ContextMenu';
import ClickAway from '../../common/ClickAway';

export default class RowLogicRule extends Component {

  static propTypes = {
    onRemoveRule: PropTypes.func,
    onUpdateOpRule: PropTypes.func,
    onUpdateCategoryRule: PropTypes.func,
    rule: PropTypes.object,
    rule2: PropTypes.object,
    category: PropTypes.string,
    path: PropTypes.number,
  }

  constructor(props) {
    super(props);
    this.handleClicking = this.handleClicking.bind(this);
    this.handleSecondCondition = this.handleSecondCondition.bind(this);
  }

  state = {
    selected: false,
    selected2: false,
    showConditions: true,
    showConditions2: false,
    conditionsValue: '',
    conditionsValue2: '',
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

  selectOptions = [
    this.getDict('<'),
    this.getDict('<='),
    this.getDict('=='),
    this.getDict('>='),
    this.getDict('>'),
  ]

  handleClicking(e) {
    this.setState({ showConditions: true });
    e.preventDefault();
  }
  handleSecondCondition(e) {
    this.setState({ showConditions2: true });
    e.preventDefault();
  }


  render() {
    const { selected,
            showConditions,
            conditionsValue,
            selected2,
            showConditions2,
            conditionsValue2,
            categoryValue,
            } = this.state;

    const { onRemoveRule, onUpdateOpRule, onUpdateCategoryRule,
      rule, rule2, category, path } = this.props;
    // eslint-disable-line no-unused-vars
    return (
      <Row className="DeriveCategoryMapping">
        <Col xs={2} className="DeriveCategoryMapping__text" style={{ display: '-webkit-inline-box' }} >
          <a
            onClick={() => onRemoveRule(path)}
            className="fa fa-times-circle"
            style={{ fontSize: '2em', marginRight: '5px' }}
          />
          <ClickAway
            onClickAway={() => {
              this.setState({ showConditions: false });
            }}
          >
            { showConditions ?
              <ContextMenu
                style={{ left: 0 }}
                onOptionSelected={(op) => {
                  if (this.nameInput !== undefined) {
                    this.nameInput.focus();
                  }
                  this.setState({ selected: true, showConditions: false, conditionsValue: op });
                  onUpdateOpRule(path, 0, op, rule.opValue);
                }}
                options={this.selectOptions}
              />
              : <div onClick={this.handleClicking}>{this.dict[conditionsValue]}</div>}
          </ClickAway>
        </Col>
        <Col xs={1} className="DeriveCategoryMapping__text" >
          <input
            ref={(input) => { this.nameInput = input; }}
            hidden={!selected}
            value={rule.opValue || ''}
            size="10"
            placeholder="Enter a number"
            onChange={(event) => {
              onUpdateOpRule(path, 0, rule.op, event.target.value);
            }}
            title=""
          />
        </Col>
        <Col xs={1} className="DeriveCategoryMapping__text" >
          { selected ? <div>
            <a
              style={{ textDecoration: 'underline',
                color: !conditionsValue2 ? '#c3c3c3' : 'black' }}
              onClick={this.handleSecondCondition}
            > AND </a>
            <a
              onClick={() => {
                this.setState({ selected2: false, showConditions2: false, conditionsValue2: null });
              }}
              className="fa fa-times-circle"
              style={{ visibility: !conditionsValue2 ? 'hidden' : 'visible' }}
            /></div>
            : ''}
        </Col>
        <Col xs={2} className="DeriveCategoryMapping__text" >
          <ClickAway
            onClickAway={() => {
              this.setState({ showConditions2: false });
            }}
          >
            { showConditions2 ?
              <ContextMenu
                style={{ left: 0 }}
                onOptionSelected={(op) => {
                  if (this.nameInput2 !== undefined) {
                    this.nameInput2.focus();
                  }
                  this.setState({ selected2: true, showConditions2: false, conditionsValue2: op });
                  onUpdateOpRule(path, 1, op, rule2.opValue);
                }}
                options={this.selectOptions}
              /> : <div
                hidden={!selected2}
                onClick={this.handleSecondCondition}
              >{this.dict[conditionsValue2]}
              </div>
          }
          </ClickAway>
        </Col>
        <Col xs={1} className="DeriveCategoryMapping__text" >
          <input
            ref={(input) => { this.nameInput2 = input; }}
            hidden={!selected2}
            value={rule2.opValue || ''}
            size="10"
            placeholder="Enter a number"
            onChange={(event) => {
              onUpdateOpRule(path, 1, rule2.op, event.target.value);
            }}
            title=""
          />
        </Col>
        <Col xs={5} className="DeriveCategoryMapping__input-wrap">
          <input
            value={category || ''}
            placeholder={categoryValue}
            onChange={(event) => {
              onUpdateCategoryRule(path, event.target.value);
            }}
            title=""
          />
        </Col>
      </Row>
    );
  }
}
