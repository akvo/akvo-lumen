import React, { PropTypes } from 'react';

require('../../styles/DashboardVisualisationList.scss');

const formatDate = (date) => {
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  if (month < 10) month = `0${month}`;
  if (day < 10) day = `0${day}`;
  if (hours < 10) hours = `0${hours}`;
  if (minutes < 10) minutes = `0${minutes}`;

  return `${date.getFullYear()}-${month}-${day} ${hours}:${minutes}`;
};

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
        </div> : <ul className="list">
          {props.visualisations.slice(0).sort((a, b) => b.modified - a.modified).map(item =>
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
      }
    </div>
  );
}

DashboardVisualisationList.propTypes = {
  dashboardItems: PropTypes.object.isRequired,
  visualisations: PropTypes.array.isRequired,
  onEntityClick: PropTypes.func.isRequired,
};
