import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import './AggregationError.scss';

const AggregationError = ({ reason, count, max }) => {
  let contents;

  switch (reason) {
    case 'too-many':
      contents = (
        <div>
          <p>
            <FormattedMessage
              id="too_many_visualisation_elements"
              values={{
                count,
                max,
              }}
            />
          </p>
          <p>
            <FormattedMessage
              id="please_edit_visualisation"
            />
          </p>
        </div>
      );
      break;
    case 'invalid-filter':
      contents = (
        <div>
          <p>
            <FormattedMessage
              id="invalid_filter"
            />
          </p>
        </div>
      );
      break;
    default:
      console.warn(`Unknown reason ${reason}`); // eslint-disable-line
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
