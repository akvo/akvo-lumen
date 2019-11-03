/* eslint-disable import/prefer-default-export */
import PropTypes from 'prop-types';

export const commonPropTypes = {
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
