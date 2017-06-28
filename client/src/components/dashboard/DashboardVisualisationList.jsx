import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { filterVisualisations, formatDate } from '../../utilities/dashboard';

require('./DashboardVisualisationList.scss');

export default class DashboardVisualisationList extends Component {
  constructor() {
    super();
    this.state = {
      filterText: '',
    };
  }

  render() {
    const { props } = this;
    const isOnDashboard = item => Boolean(props.dashboardItems[item.id]);
    let visualisations = props.visualisations.slice(0);
    const showFilterInput = visualisations.length > 5;

    visualisations = filterVisualisations(visualisations, this.state.filterText);
    visualisations.sort((a, b) => b.modified - a.modified);

    return (
      <div
        className="DashboardVisualisationList"
      >
        {props.visualisations.length === 0 ?
          <div
            className="noVisualisationsMessage"
          >
            No visualisations to show.
          </div>
          :
          <div>
            {showFilterInput &&
              <div className="filterInput">
                <label
                  htmlFor="filterText"
                >
                  Filter list by title
                </label>
                <input
                  type="text"
                  name="filterText"
                  placeholder="Visualisation title"
                  value={this.state.filterText}
                  onChange={evt => this.setState({ filterText: evt.target.value })}
                />
              </div>
            }
            <ul className="list">
              {visualisations.map(item =>
                <li
                  className={`listItem clickable ${item.visualisationType}
                  ${isOnDashboard(item) ? 'added' : ''}`}
                  key={item.id}
                  onClick={() => props.onEntityClick(item, 'visualisation')}
                >
                  <h4>
                    {item.name}
                    <span
                      className="isOnDashboardIndicator"
                    >
                      {isOnDashboard(item) ? '✔' : ''}
                    </span>
                  </h4>
                  <div className="visualisationType">
                    {item.visualisationType === 'map' ?
                    'Map'
                    :
                    `${item.visualisationType.charAt(0).toUpperCase() +
                        item.visualisationType.slice(1)} chart`
                  }
                  </div>
                  <div className="lastModified">
                    {`Last modified: ${formatDate(new Date(item.modified))}`}
                  </div>
                  <div className="background" />
                </li>
            )}
            </ul>
            {(this.state.filterText && visualisations.length === 0) &&
              <div className="filterHelpText">
                No visualisations match your filter.
                <div className="buttonContainer">
                  <button
                    className="clickable"
                    onClick={() => this.setState({ filterText: '' })}
                  >
                    Clear filter
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
  onEntityClick: PropTypes.func.isRequired,
};
