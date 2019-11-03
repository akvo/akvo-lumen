/* eslint-disable import/prefer-default-export */
import PropTypes from 'prop-types';

export const barPropTypes = {
  data: PropTypes.shape({
    data: PropTypes.oneOfType([
      PropTypes.arrayOf(
        PropTypes.shape({
          key: PropTypes.string,
          value: PropTypes.number,
        })
        ),
      PropTypes.arrayOf(
        PropTypes.shape({
          key: PropTypes.string,
          values: PropTypes.arrayOf(
                PropTypes.number
            ),
        })
        ),
    ]),
    metadata: PropTypes.object,
  }),
  colors: PropTypes.array.isRequired,
  colorMapping: PropTypes.object,
  defaultColor: PropTypes.string.isRequired,
  onChangeVisualisationSpec: PropTypes.func,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  legendPosition: PropTypes.oneOf(['top', 'right', 'bottom', 'left', undefined]),
  print: PropTypes.bool,
  interactive: PropTypes.bool,
  edit: PropTypes.bool,
  padding: PropTypes.number,
  marginLeft: PropTypes.number,
  marginRight: PropTypes.number,
  marginTop: PropTypes.number,
  marginBottom: PropTypes.number,
  style: PropTypes.object,
  legendVisible: PropTypes.bool,
  valueLabelsVisible: PropTypes.bool,
  yAxisLabel: PropTypes.string,
  yAxisTicks: PropTypes.number,
  xAxisLabel: PropTypes.string,
  grid: PropTypes.bool,
  visualisation: PropTypes.object,
};

export const stackedBarPropTypes = {
  data: PropTypes.shape({
    series: PropTypes.array,
    common: PropTypes.object,
    metadata: PropTypes.object,
  }),
  colors: PropTypes.array.isRequired,
  colorMapping: PropTypes.object,
  onChangeVisualisationSpec: PropTypes.func,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  legendPosition: PropTypes.oneOf(['top', 'right', 'bottom', 'left', undefined]),
  print: PropTypes.bool,
  interactive: PropTypes.bool,
  edit: PropTypes.bool,
  padding: PropTypes.number,
  marginLeft: PropTypes.number,
  marginRight: PropTypes.number,
  marginTop: PropTypes.number,
  marginBottom: PropTypes.number,
  style: PropTypes.object,
  legendVisible: PropTypes.bool,
  labelsVisible: PropTypes.bool,
  valueLabelsVisible: PropTypes.bool,
  legendTitle: PropTypes.string,
  yAxisLabel: PropTypes.string,
  xAxisLabel: PropTypes.string,
  subBucketMethod: PropTypes.string,
  grid: PropTypes.bool,
  yAxisTicks: PropTypes.number,
  visualisation: PropTypes.object,
};


export const stackedBarDefaultsProps = {
  interactive: true,
  marginLeft: 70,
  marginRight: 70,
  marginTop: 20,
  marginBottom: 60,
  legendVisible: true,
  labelsVisible: true,
  edit: false,
  padding: 0.1,
  colorMapping: {},
  grouped: false,
  grid: true,
};
