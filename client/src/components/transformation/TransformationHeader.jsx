import React from 'react';
import PropTypes from 'prop-types';
import Header from '../common/Header';

import './TransformationHeader.scss';

function ApplyButton({ buttonText, isValidTransformation, onApply }) {
  return (
    <button
      className="transformButton clickable"
      onClick={onApply}
      disabled={!isValidTransformation}
    >
      <span>{buttonText}</span>
    </button>
  );
}

ApplyButton.propTypes = {
  buttonText: PropTypes.string.isRequired,
  isValidTransformation: PropTypes.bool.isRequired,
  onApply: PropTypes.func.isRequired,
};

export default function TransformationHeader({
  datasetId, buttonText, titleText, onApply, transformation,
}) {
  return (
    <Header
      className="TransformationHeader"
      backButtonTarget={`/dataset/${datasetId}`}
      actions={
        <ApplyButton
          buttonText={buttonText || 'Apply'}
          isValidTransformation={transformation != null}
          onApply={() => onApply(transformation)}
        />
      }
    >
      <h1 className="title">{titleText}</h1>
    </Header>
  );
}

TransformationHeader.propTypes = {
  datasetId: PropTypes.string.isRequired,
  buttonText: PropTypes.string,
  titleText: PropTypes.string.isRequired,
  onApply: PropTypes.func.isRequired,
  // Transformation should be null if it's not "valid"
  transformation: PropTypes.object,
};
