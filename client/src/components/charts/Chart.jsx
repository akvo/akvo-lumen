import React, { PropTypes } from 'react';
import vg from 'vega';
import * as chart from '../../utilities/chart';

function getSize(computedWidth) {
  let size;

  if (computedWidth < 240) {
    size = 'xsmall';
  } else if (computedWidth < 480) {
    size = 'small';
  } else if (computedWidth < 720) {
    size = 'medium';
  } else if (computedWidth < 860) {
    size = 'large';
  } else {
    size = 'xlarge';
  }

  return size;
}

export default function Chart({ visualisation, datasets, width, height }) {
  const { visualisationType } = visualisation;
  const chartData = chart.getChartData(visualisation, datasets);
  const containerHeight = height || 400;
  const containerWidth = width || 800;
  const chartSize = getSize(containerWidth);
  const className = `Chart ${visualisationType} ${chartSize}`;
  const vegaSpec = chart.getVegaSpec(visualisation, chartData, containerHeight, containerWidth);
  const elKey = visualisation.id ? visualisation.id : 'newVisualisation';

  vg.parse.spec(vegaSpec, (error, vchart) => vchart({ el: `.viz-${elKey}` }).update());

  return (
    <div
      className={className}
      style={{
        width: containerWidth,
        height: containerHeight,
      }}
    >
      <div className={`viz-${elKey}`} />
    </div>
  );
}

Chart.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
};
