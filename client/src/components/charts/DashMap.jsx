import React, { PropTypes } from 'react';
import { Map, Marker, Popup, TileLayer } from 'react-leaflet';
import * as chart from '../../utilities/chart';

require('../../../node_modules/leaflet/dist/leaflet.css');
require('../../styles/DashMap.scss');


export default function DashMap({ visualisation, datasets }) {
  const chartData = chart.getChartData(visualisation, datasets);
  console.dir(chartData[0].values)

  return (
    <div className="DashMap dashChart">
      <Map
        center={[0,0]}
        zoom={2}
        scrollWheelZoom={false}
      >
        <TileLayer
          url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        {
          chartData[0].values.map((entry, index) =>
            <Marker position={entry.position}>
            </Marker>
          )
        }
      </Map>
    </div>
  );
}

DashMap.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};
