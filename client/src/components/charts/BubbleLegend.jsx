import React from 'react';
import PropTypes from 'prop-types';

import './BubbleLegend.scss';

const BubbleLegend = ({ title }) => (
  <div className="BubbleLegend">
    <div className="BubbleLegend__bubble BubbleLegend__bubble--sm" />
    <div className="BubbleLegend__bubble BubbleLegend__bubble--md" />
    <div className="BubbleLegend__bubble BubbleLegend__bubble--lg" />
    <div className="BubbleLegend__title">
      {title}
    </div>
  </div>
);

BubbleLegend.propTypes = {
  title: PropTypes.string.isRequired,
};

export default BubbleLegend;
