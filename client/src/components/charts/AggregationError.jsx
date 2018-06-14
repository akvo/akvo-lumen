import React from 'react';
import PropTypes from 'prop-types';

import './AggregationError.scss';

const AggregationError = ({ reason, count, max }) => {
  let contents;

  switch (reason) {
    case 'too-many':
      contents = (
        <div>
          <p>
            This visualisation cannot be displayed because it has {count} elements.
            The maximum number of elements is {max}.
          </p>
          <p>
            Please edit the visualisation or add a filter.
          </p>
        </div>
      );
      break;
    default:
      console.warn(`Unknown reason ${reason}`);
  }
  return (
    <div className="AggregationError">
      {contents}
    </div>
  );
};


AggregationError.propTypes = {
  reason: PropTypes.oneOf(['too-many']),
  max: PropTypes.number,
  count: PropTypes.number,
};

export default AggregationError;
