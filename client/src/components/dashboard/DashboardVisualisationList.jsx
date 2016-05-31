import React, { PropTypes } from 'react';

require('../../styles/DashboardVisualisationList.scss');

export default function DashboardVisualisationList(props) {
  const isOnDashboard = item => Boolean(props.dashboardItems[item.id]);

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
        <ul
          className="list"
        >
          {props.visualisations.map(item =>
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
            </li>
          )}
        </ul>
      }
    </div>
  );
}

DashboardVisualisationList.propTypes = {
  dashboardItems: PropTypes.object.isRequired,
  visualisations: PropTypes.array.isRequired,
  onEntityClick: PropTypes.func.isRequired,
};
