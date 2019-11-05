import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { FormattedMessage, intlShape, injectIntl } from 'react-intl';
import ConfigMenuSectionOptionSelect from '../../common/ConfigMenu/ConfigMenuSectionOptionSelect';

import Button from '../../common/Button';
import SelectMenu from '../../common/SelectMenu';
import { filterColumns } from '../../../utilities/utils';
import './FilterMenu.scss';

// TODO:
const getMenuSeries = series => series;
// eslint-disable-next-line max-len
// seriesArray => seriesArray.filter(item => item.origin !== 'pivot-row' && item.origin !== 'pivot-column');

class SeriesMenu extends Component {

  constructor() {
    super();
    this.state = {
      inputInProgress: false,
      newSeriesColumn: null,
    };

    this.toggleInput = this.toggleInput.bind(this);
    this.updateNewSeries = this.updateNewSeries.bind(this);
  }

  updateNewSeries(value, index) {
    console.log('updateNewSeries index', index, 'value', value);
    if (value == null) {
      this.toggleInput();
    }
    this.saveSerie(value);
  }

  saveSerie(newSeriesColumn) {
    const { columnOptions } = this.props;
    console.log('saving', newSeriesColumn);
    const metricColumnsY = this.props.metricColumnsY.slice(0);

    metricColumnsY.push(
      newSeriesColumn
    );

    this.props.onChangeSpec({
      metricColumnsY,
    });

    this.setState({
      inputInProgress: false,
      newSeriesColumn: null,
    });
  }

  deleteFilter(index) {
    const series = getMenuSeries(this.props.metricColumnsY);
    const delSerie = series[index];
    // Raw filter array, including filters from other origins
    const rawSeries = this.props.metricColumnsY;
    const filterIndex = rawSeries.findIndex(entry => Boolean(
      entry.column === rawSeries.column &&
      entry.value === rawSeries.value &&
      entry.operation === rawSeries.operation &&
      entry.strategy === rawSeries.strategy &&
      entry.origin === rawSeries.origin
    ));

    if (filterIndex === -1) {
      throw new Error(`Cannot delete serie ${delSerie} as it does not appear in spec.metricColumnsY`);
    } else {
      rawSeries.splice(filterIndex, 1);
      this.props.onChangeSpec({
        metricColumnsY: rawSeries,
      });
    }
  }

  toggleInput() {
    this.setState({
      inputInProgress: !this.state.inputInProgress,
    });
  }

  render() {
    const { hasDataset, columnOptions, intl } = this.props;
    const { formatMessage } = intl;
    const metricColumnsY = getMenuSeries(this.props.metricColumnsY);
    const {
      newSeriesColumn,
      inputInProgress,
    } = this.state;
    metricColumnsY.map((metricColumnY) => console.log(metricColumnY));
    return (
      <div className={`FilterMenu inputGroup ${hasDataset ? 'enabled' : 'disabled'}`}>
        <div>
          <div className="container">
            {(!metricColumnsY || metricColumnsY.length === 0) ? (
              <div className="noFilters">No series</div>
            ) : (
              <div className="filterListContainer">
                <ol className="filterList">
                  {metricColumnsY.map((metricColumnY, index) => (
                    (<div key={index}>
                      <ConfigMenuSectionOptionSelect
                        id="metric_column"                    
                        placeholderId="select_a_metric_column"
                        labelTextId="metric_column"
                        value={metricColumnY !== null ? metricColumnY : null}
                        name="metricColumnYInput"
                        clearable
                        onChange={choice => this.updateNewSeries(choice, index)}
                        options={filterColumns(columnOptions, ['number'])}
                      />
                    </div>
                    )
                  ))}
                </ol>
              </div>
            )}
            {inputInProgress && (
              <div className="inputGroup">
                <div className="filterBodyContainer">
                  <SelectMenu
                    className="filterColumnInput"
                    name="filterColumnInput"
                    placeholder={`${formatMessage({ id: 'select_a_column' })}...`}
                    value={newSeriesColumn || null}
                    clearable
                    options={filterColumns(columnOptions, ['number'])}
                    onChange={choice => this.updateNewSeries(choice)}
                  />
                </div>
              </div>
            )}
            {!inputInProgress && (
              <Button onClick={this.toggleInput} primary>
                <i className="fa fa-plus" aria-hidden="true" />
                &nbsp;
                <FormattedMessage id="select_a_column" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
}

SeriesMenu.propTypes = {
  intl: intlShape,
  metricColumnsY: PropTypes.array.isRequired,
  hasDataset: PropTypes.bool.isRequired,
  columnOptions: PropTypes.array.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
};

export default injectIntl(SeriesMenu);
