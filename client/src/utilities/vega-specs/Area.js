import { defaultPrimaryColor } from '../visualisationColors';

export default function getVegaAreaSpec(visualisation, data, containerHeight, containerWidth) {
  const { visualisationType } = visualisation;
  const dataSource = 'table';
  const fieldX = 'x';
  const fieldY = 'y';
  const xAxisType = data[0].metadata.xAxisType;
  const paddingTop = 30;
  const paddingRight = xAxisType === 'date' ? 80 : 20;
  const paddingBottom = xAxisType === 'date' ? 120 : 90;
  const paddingLeft = 50;

  return ({
    data,
    height: containerHeight - (paddingTop + paddingBottom),
    width: containerWidth - (paddingLeft + paddingRight),
    padding: {
      top: paddingTop,
      right: paddingRight,
      bottom: paddingBottom,
      left: paddingLeft,
    },
    scales: [
      {
        name: 'x',
        type: 'linear',
        range: 'width',
        zero: false,
        nice: xAxisType === 'date', // round number origin
        domain: {
          data: dataSource,
          field: fieldX,
        },
      },
      {
        name: 'y',
        type: 'linear',
        range: 'height',
        nice: true,
        domain: {
          data: dataSource,
          field: fieldY,
        },
      },
    ],
    axes: [
      {
        type: 'x',
        scale: 'x',
        title: visualisation.spec.axisLabelX,
        properties: {
          labels: {
            text: {
              template: xAxisType === 'date' ? '{{datum.data|time:"%Y-%m-%d %H:%M:%S"}}' : '{{datum.data}}',
            },
            angle: {
              value: 45,
            },
            align: {
              value: 'left',
            },
          },
        },
      },
      {
        type: 'y',
        scale: 'y',
        title: visualisation.spec.axisLabelY,
      },
    ],
    marks: [
      visualisationType === 'area' ?
        {
          type: 'area',
          from: {
            data: dataSource,
          },
          properties: {
            enter: {
              x: {
                scale: 'x',
                field: fieldX,
              },
              y: {
                scale: 'y',
                field: fieldY,
              },
              y2: {
                scale: 'y',
                value: 0,
              },
              fill: {
                value: defaultPrimaryColor,
              },
            },
          },
        }
        :
        {
          type: 'line',
          from: {
            data: dataSource,
          },
          properties: {
            enter: {
              x: {
                scale: 'x',
                field: fieldX,
              },
              y: {
                scale: 'y',
                field: fieldY,
              },
              y2: {
                scale: 'y',
                value: 0,
              },
              stroke: {
                value: defaultPrimaryColor,
              },
            },
          },
        },
    ],
  });
}
