import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { getDataLastUpdated } from '../../utilities/chart';
import { getIconUrl } from '../../domain/entity';
import { specIsValidForApi } from '../../utilities/aggregation';
import SelectMenu from '../common/SelectMenu';
import { trackEvent } from '../../utilities/analytics';
import { FILTER_DASHBOARD_BY_DATASET } from '../../constants/analytics';

require('./DashboardVisualisationList.scss');

const filterVisualisations = (visualisations, filterText, filterByDataset) => {
  // NB - this naive approach is fine with a few hundred visualisations, but we should replace
  // with something more serious before users start to have thousands of visualisations
  let datasetCondition = () => true;
  if (filterByDataset) {
    datasetCondition = datasetId => datasetId === filterByDataset;
  }

  if (!filterText) {
    return visualisations.filter(({ spec, visualisationType, datasetId }) =>
      specIsValidForApi(spec, visualisationType) && datasetCondition(datasetId)
    );
  }

  return visualisations.filter((visualisation) => {
    if (!specIsValidForApi(visualisation.spec, visualisation.visualisationType)) {
      return false;
    }

    let name = visualisation.name || '';
    name = name.toString().toLowerCase();
    return name.indexOf(filterText.toString().toLowerCase()) > -1
            && datasetCondition(visualisation.datasetId);
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
    const visualisationsSet = new Set(visualisations.map(v => v.datasetId).filter(v => v));
    const datasetsWithViss = Object.keys(datasets).filter(d => visualisationsSet.has(d))
                              .reduce((c, v) => { const h = c; h[v] = datasets[v]; return c; }, {});
    const viss = filterVisualisations(visualisations, filterText, filterByDataset);
    const numMaxVisualisations = 5;
    const showFilterByDataset = visualisations.length > numMaxVisualisations;

    viss.sort((a, b) => b.modified - a.modified);
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
                    trackEvent(FILTER_DASHBOARD_BY_DATASET);
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
                const dataLastUpdated = getDataLastUpdated({
                  visualisation: item,
                  datasets,
                });
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

                      <div className="visualisationType">
                        {item.visualisationType === 'map' ?
                        'Map'
                        :
                        `${item.visualisationType.charAt(0).toUpperCase() +
                            item.visualisationType.slice(1)} chart`
                      }
                      </div>
                      <br />
                      {dataLastUpdated && (
                        <div className="lastModified">
                          <FormattedMessage id="data_last_updated" />
                          : {dataLastUpdated}
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
