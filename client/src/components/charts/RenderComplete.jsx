import React from 'react';
import PropTypes from 'prop-types';

const RenderComplete = ({ id }) => <div className={`render-completed-${id}`} />;

RenderComplete.propTypes = {
  id: PropTypes.string.isRequired,
};

export default RenderComplete;
