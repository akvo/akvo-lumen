import { Component } from 'react';
import { connect } from 'react-redux';
import windowSize from 'react-window-size';
import PropTypes from 'prop-types';

import { printBegin, printEnd } from '../actions/print';

export const printShape = PropTypes.shape({
  isPrinting: PropTypes.bool,
  dimensions: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number,
  }),
});

class PrintProvider extends Component {
  constructor(props) {
    super(props);
    this.handlePrintBegin = this.handlePrintBegin.bind(this);
    this.handlePrintEnd = this.handlePrintEnd.bind(this);
    this.cleanUp = this.cleanUp.bind(this);
  }

  componentDidMount() {
    if (window.matchMedia) {
      var mediaQueryList = window.matchMedia('print');
      mediaQueryList.addListener((mql) => {
        if (mql.matches) {
          this.handlePrintBegin();
        } 
      });
    }
    window.onbeforeprint = this.handlePrintBegin;
  }
  
  componentWillUnmount() {
    this.cleanUp();
  }
  
  handlePrintBegin() {
    const { windowWidth, windowHeight } = this.props;
    this.props.dispatch(printBegin({ width: windowWidth, height: windowHeight }));
    window.addEventListener('mouseover', this.handlePrintEnd);
  }
  
  handlePrintEnd() {
    this.props.dispatch(printEnd());
    this.cleanUp();                                
  }
  
  cleanUp () {
    window.removeEventListener('mouseover', this.handlePrintEnd);
  }
  
  render() {
    return this.props.children;
  }
}

export default connect()(windowSize(PrintProvider));
