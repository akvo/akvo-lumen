/* eslint-disable no-plusplus, import/no-extraneous-dependencies */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, number, text, boolean, color } from '@storybook/addon-knobs/react';
import { palette as generatePalette } from '@potion/color';
import { interpolateSpectral } from 'd3-scale-chromatic';
import { hsl } from 'd3-color';
import moment from 'moment';

import '../../styles/reset.global.scss';
import '../../styles/style.global.scss';
import PieChart from './PieChart';
import ScatterChart from './ScatterChart';
import LineChart from './LineChart';
import BarChart from './BarChart';

const letters = 'abcdef ghijklmn opqrstuvwxyz 123456789'.split('');
const letterCount = letters.length;

const randomString = (length = 10) => {
  const result = [];
  for (let i = 0; i < length; i++) {
    result.push(letters[Math.floor(Math.random() * letterCount)]);
  }
  return result.join('');
};

const randomIntFromInterval = (min, max) => Math.floor((Math.random() * ((max - min) + 1)) + min);

const rainbowColors = [];
const intervals = 30;
const increment = 1 / intervals;
for (let i = 0; i < intervals; i++) {
  const c = hsl(interpolateSpectral(i * increment));
  rainbowColors.push(`${c}`);
}
const palette = generatePalette({ colors: rainbowColors });

const generateData = ({ seriesCount, nodeCount, minVal, maxVal, labelLength }) => {
  const result = {
    series: [],
    common: { data: [], metadata: {} },
  };

  for (let s = 0; s < seriesCount; s++) {
    const series = { data: [], key: `ser_${randomString(10)}` };
    result.series.push(series);
    for (let i = 0; i < nodeCount; i++) {
      series.data.push({
        value: randomIntFromInterval(minVal, maxVal),
      });
    }
  }

  const startDate = moment().subtract(nodeCount, 'months');

  for (let i = 0; i < nodeCount; i++) {
    result.common.data.push({
      key: `val_${randomString(labelLength || 10)}`,
      timestamp: startDate.clone().add(i, 'months').toDate(),
    });
  }
  return result;
};

class ContextProvider extends Component {
  static childContextTypes = {
    abbrNumber: PropTypes.func,
  }

  static propTypes = {
    children: PropTypes.node,
  }

  getChildContext() {
    return {
      abbrNumber: val => val,
    };
  }

  render() {
    return this.props.children;
  }
}

storiesOf('Charts', module)
  .addDecorator(withKnobs)
  .addDecorator(story => (
    <ContextProvider>
      {story()}
    </ContextProvider>
  ))

  .add('PieChart', () => {
    const nodeCount = number('node count', 20);
    const labelLength = number('label length', 10);
    const minVal = number('min value', 1);
    const maxVal = number('max value', 100);

    const data = generateData({
      seriesCount: 1,
      nodeCount,
      labelLength,
      minVal,
      maxVal,
    });

    return (
      <div>
        <PieChart
          style={{ border: '1px solid black' }}
          data={{
            ...data,
            metadata: {
              bucketColumnTitle: text('props.data.metadata.bucketColumnTitle', 'Legend Title'),
            },
          }}
          colors={palette(nodeCount)}
          colorMapping={{ [data.common.data[0].key]: color('props.colorMapping[key]', 'rgb(158, 1, 66)') }}
          innerRadius={number('props.innerRadius', 0)}
          outerRadius={number('props.outerRadius', 0.3)}
          onChangeVisualisationSpec={action('vis-spec-change')}
          width={number('props.width', 600)}
          height={number('props.height', 600)}
          donut={boolean('props.donut', false)}
          print={boolean('props.print', false)}
          interactive={boolean('props.interactive', true)}
          edit={boolean('props.edit', true)}
          legendVisible={boolean('props.legendVisible', true)}
        />
        <pre>
          <code>
            {JSON.stringify(data, null, 2)}
          </code>
        </pre>
      </div>
    );
  })

  .add('ScatterChart', () => {
    const nodeCount = number('node count', 10);
    const labelLength = number('label length', 10);
    const minVal = number('min value', 1);
    const maxVal = number('max value', 100);
    const data = generateData({
      seriesCount: 2,
      nodeCount,
      labelLength,
      minVal,
      maxVal,
    });

    return (
      <div>
        <ScatterChart
          style={{ border: '1px solid black' }}
          data={{
            ...data,
            metadata: {
              bucketColumnTitle: text('props.data.metatdata.bucketColumnTitle', 'Legend Title'),
            },
          }}
          colors={palette(nodeCount)}
          onChangeVisualisationSpec={action('vis-spec-change')}
          width={number('props.width', 600)}
          height={number('props.height', 600)}
          opacity={number('props.opacity', 0.9)}
          marginTop={number('props.marginTop', 70)}
          marginRight={number('props.marginRight', 70)}
          marginBottom={number('props.marginBottom', 70)}
          marginLeft={number('props.marginLeft', 70)}
          grid={boolean('props.grid', true)}
          print={boolean('props.print', false)}
          interactive={boolean('props.interactive', true)}
          edit={boolean('props.edit', true)}
          legendVisible={boolean('props.legendVisible', false)}
          xAxisLabel={text('props.xAxisLabel', 'Humidity')}
          yAxisLabel={text('props.yAxisLabel', 'Temperature')}
          xAxisTicks={number('props.xAxisTicks')}
          yAxisTicks={number('props.yAxisTicks')}
        />
        <pre>
          <code>
            {JSON.stringify(data, null, 2)}
          </code>
        </pre>
      </div>
    );
  })

  .add('LineChart/AreaChart', () => {
    const nodeCount = number('node count', 20);
    const minVal = number('min value', 1);
    const maxVal = number('max value', 100);
    const data = generateData({
      seriesCount: 1,
      nodeCount,
      minVal,
      maxVal,
    });

    return (
      <div>
        <LineChart
          area={boolean('props.area', false)}
          style={{ border: '1px solid black' }}
          data={{
            ...data,
            metadata: {
              bucketColumnTitle: text('props.data.metatdata.bucketColumnTitle', 'Legend Title'),
            },
          }}
          color={color('props.color', '#5744B8')}
          onChangeVisualisationSpec={action('vis-spec-change')}
          width={number('props.width', 600)}
          height={number('props.height', 600)}
          marginTop={number('props.marginTop', 20)}
          marginRight={number('props.marginRight', 70)}
          marginBottom={number('props.marginBottom', 120)}
          marginLeft={number('props.marginLeft', 70)}
          grid={boolean('props.grid', true)}
          print={boolean('props.print', false)}
          interactive={boolean('props.interactive', true)}
          edit={boolean('props.edit', true)}
          xAxisLabel={text('props.xAxisLabel', 'Date')}
          yAxisLabel={text('props.yAxisLabel', 'Temperature')}
          xAxisTicks={number('props.xAxisTicks')}
          yAxisTicks={number('props.yAxisTicks')}
        />
        <pre>
          <code>
            {JSON.stringify(data, null, 2)}
          </code>
        </pre>
      </div>
    );
  })

  .add('BarChart', () => {
    const nodeCount = number('node count', 20);
    const minVal = number('min value', 1);
    const maxVal = number('max value', 100);
    const labelLength = number('label length', 10);
    const data = generateData({
      seriesCount: 1,
      nodeCount,
      labelLength,
      minVal,
      maxVal,
    });

    return (
      <div>
        <BarChart
          style={{ border: '1px solid black' }}
          data={{
            ...data,
            metadata: {
              bucketColumnTitle: text('props.data.metatdata.bucketColumnTitle', 'Legend Title'),
            },
          }}
          colors={palette(nodeCount)}
          onChangeVisualisationSpec={action('vis-spec-change')}
          width={number('props.width', 600)}
          height={number('props.height', 600)}
          padding={number('props.padding', 0.1)}
          marginTop={number('props.marginTop', 20)}
          marginRight={number('props.marginRight', 70)}
          marginBottom={number('props.marginBottom', 120)}
          marginLeft={number('props.marginLeft', 70)}
          grid={boolean('props.grid', true)}
          print={boolean('props.print', false)}
          interactive={boolean('props.interactive', true)}
          edit={boolean('props.edit', true)}
          legendVisible={boolean('props.legendVisible', false)}
          yAxisLabel={text('props.yAxisLabel', 'Y Axis')}
          xAxisLabel={text('props.xAxisLabel', 'X Axis')}
        />
        <pre>
          <code>
            {JSON.stringify(data, null, 2)}
          </code>
        </pre>
      </div>
    );
  })

  .add('BarChart (Stacked)', () => {
    const seriesCount = number('series count', 5);
    const nodeCount = number('node count', 20);
    const minVal = number('min value', 1);
    const maxVal = number('max value', 100);
    const labelLength = number('label length', 10);
    const data = generateData({
      seriesCount,
      nodeCount,
      labelLength,
      minVal,
      maxVal,
    });

    return (
      <div>
        <BarChart
          style={{ border: '1px solid black' }}
          data={{
            ...data,
            metadata: {
              bucketColumnTitle: text('props.data.metatdata.bucketColumnTitle', 'Legend Title'),
            },
          }}
          colors={palette(seriesCount)}
          onChangeVisualisationSpec={action('vis-spec-change')}
          width={number('props.width', 600)}
          height={number('props.height', 600)}
          marginTop={number('props.marginTop', 20)}
          marginRight={number('props.marginRight', 70)}
          marginBottom={number('props.marginBottom', 120)}
          marginLeft={number('props.marginLeft', 70)}
          grouped={boolean('props.grouped', false)}
          grid={boolean('props.grid', true)}
          print={boolean('props.print', false)}
          interactive={boolean('props.interactive', true)}
          edit={boolean('props.edit', true)}
          legendVisible={boolean('props.legendVisible', true)}
          yAxisLabel={text('props.yAxisLabel', 'Temperature')}
        />
        <pre>
          <code>
            {JSON.stringify(data, null, 2)}
          </code>
        </pre>
      </div>
    );
  });
