import React from 'react';
import PropTypes from 'prop-types';

import './BubbleLegend.scss';
import { FormattedMessage, injectIntl } from 'react-intl';

const MAX_LENGTH = 30;

const BubbleLegend = ({ title }) => title.length > MAX_LENGTH ? (
  <div className="BubbleLegend">
    <h4>
      <FormattedMessage id="size" />
    </h4>
    <p>{title}</p>
  </div>
) : (
  <div className="BubbleLegend">
    <div className="BubbleLegend__bubbles">
      <div className="BubbleLegend__bubble BubbleLegend__bubble--sm" />
      <div className="BubbleLegend__bubble BubbleLegend__bubble--md" />
      <div className="BubbleLegend__bubble BubbleLegend__bubble--lg" />
    </div>
    <div className="BubbleLegend__title">
      {title}
    </div>
  </div>
);

BubbleLegend.propTypes = {
  title: PropTypes.string.isRequired,
};

export default injectIntl(BubbleLegend);
