import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import moment from 'moment';
import { getIconUrl, getModifiedTimestamp } from '../../domain/entity';
import { specIsValidForApi } from '../../utilities/aggregation';
import { datasetsWithVisualizations, mapDatasetLayers } from '../../utilities/dataset';
import SelectMenu from '../common/SelectMenu';
import { trackEvent } from '../../utilities/analytics';
import { FILTER_VISUALISATIONS_BY_DATASET_IN_DASHBOARD } from '../../constants/analytics';

require('./DashboardVisualisationList.scss');

const filterVisualisations = (visualisations, filterText, filterByDataset, sortedBy) => {
  // NB - this naive approach is fine with a few hundred visualisations, but we should replace
  // with something more serious before users start to have thousands of visualisations
  if (sortedBy) { visualisations.sort((a, b) => b[sortedBy] - a[sortedBy]); }

  let datasetCondition = () => true;
  if (filterByDataset) {
    datasetCondition = (viz, datasetId) => {
      if (viz.visualisationType === 'map') {
        return Boolean(mapDatasetLayers(viz).find(layerDatasetId =>
          layerDatasetId === filterByDataset));
      }
      return datasetId === filterByDataset;
    };
  }

  if (!filterText) {
    return visualisations.filter(viz =>
      specIsValidForApi(viz.spec, viz.visualisationType) && datasetCondition(viz, viz.datasetId)
    );
  }
  return visualisations.filter((visualisation) => {
    if (!specIsValidForApi(visualisation.spec, visualisation.visualisationType)) {
      return false;
    }

    let name = visualisation.name || '';
    name = name.toString().toLowerCase();
    return name.indexOf(filterText.toString().toLowerCase()) > -1
            && datasetCondition(visualisation, visualisation.datasetId);
  });
};

export default class DashboardVisualisationList extends Component {
  constructor() {
    super();
    this.state = {
      filterText: '',
      filterByDataset: '',
    };
  }

  render() {
    const { dashboardItems, visualisations, datasets, onEntityClick } = this.props;
    const { filterByDataset, filterText } = this.state;
    const isOnDashboard = item => Boolean(dashboardItems[item.id]);
    const datasetsWithViss = datasetsWithVisualizations(visualisations, datasets);
    const viss = filterVisualisations(visualisations, filterText, filterByDataset, 'modified');
    const numMaxVisualisations = 5;
    const showFilterByDataset = visualisations.length > numMaxVisualisations;

    return (
      <div
        className="DashboardVisualisationList"
      >
        {visualisations.length === 0 ?
          <div
            className="noVisualisationsMessage"
          >
            <FormattedMessage id="no_visualisations_to_show" />
          </div>
          :
          <div>
            { showFilterByDataset &&
              <div className="filterInput">
                <label htmlFor="datasets">
                  <FormattedMessage id="filter_visualisations_by_dataset" />
                </label>
                <SelectMenu
                  name="datasets"
                  value={filterByDataset}
                  isClearable
                  onChange={(id) => {
                    this.setState({ filterByDataset: id, filterText: '' });
                    trackEvent(FILTER_VISUALISATIONS_BY_DATASET_IN_DASHBOARD);
                  }}
                  options={datasetsWithViss ? Object.keys(datasetsWithViss).map(d =>
                    ({ value: datasetsWithViss[d].get('id'), label: datasetsWithViss[d].get('name') })) : []}
                />
              </div>
            }
            { filterByDataset && (viss.length > numMaxVisualisations || filterText) &&
              <div className="filterInput">
                <label
                  htmlFor="filterText"
                >
                  <FormattedMessage id="filter_list_by_title" />
                </label>
                <input
                  type="text"
                  name="filterText"
                  placeholder="Visualisation title"
                  value={filterText}
                  onChange={evt => this.setState({ filterText: evt.target.value })}
                />
              </div>
            }
            <ul className="list">
              {viss.map((item) => {
                const dataLastUpdated = moment(getModifiedTimestamp(item)).format('Do MMM YYYY - HH:mm');
                return (
                  <li
                    className={`listItem clickable ${item.visualisationType.replace(' ', '')}
                    ${isOnDashboard(item) ? 'added' : ''}`}
                    data-test-name={item.name}
                    key={item.id}
                    onClick={() => onEntityClick(item, 'visualisation')}
                  >
                    <div className="entityIcon">
                      <img src={getIconUrl(item)} role="presentation" />
                    </div>
                    <div className="textContent">
                      <h3>
                        {item.name}
                        <span
                          className="isOnDashboardIndicator"
                        >
                          {isOnDashboard(item) ? '✔' : ''}
                        </span>
                      </h3>
                      <div className="author">
                        {item.author.name || item.author.email}
                      </div>
                      <br />
                      {dataLastUpdated && (
                        <div className="lastModified">
                          {dataLastUpdated}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            {(this.state.filterText && viss.length === 0) &&
              <div className="filterHelpText">
                <FormattedMessage id="no_visualisations_match_your_filter" />
                <div className="buttonContainer">
                  <button
                    className="clickable"
                    onClick={() => this.setState({ filterText: '' })}
                  >
                    <FormattedMessage id="clear_filter" />
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    );
  }
}

DashboardVisualisationList.propTypes = {
  dashboardItems: PropTypes.object.isRequired,
  visualisations: PropTypes.array.isRequired,
  datasets: PropTypes.object.isRequired,
  onEntityClick: PropTypes.func.isRequired,
};
