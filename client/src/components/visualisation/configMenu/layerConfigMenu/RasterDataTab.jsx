import React from 'react';
import PropTypes from 'prop-types';

const RasterDataTab = () =>
  // No options yet
  (
    <div className="RasterDataTab">
      <div className="inputGroup" />
    </div>
  );

RasterDataTab.propTypes = {
  layer: PropTypes.object.isRequired,
  layerIndex: PropTypes.number.isRequired,
  onChangeMapLayer: PropTypes.func.isRequired,
  columnOptions: PropTypes.array.isRequired,
  datasetOptions: PropTypes.array.isRequired,
  datasets: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
};

export default RasterDataTab;
