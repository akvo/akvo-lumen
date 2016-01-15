import React, { Component, PropTypes } from 'react';
import DatasetGraph from './DatasetGraph';
import VisualisationItem from './VisualisationItem';


export default class DashboardList extends Component {
  render() {
    return (
      <div>
        <ul>
      	{
      		this.props.dashboards.all.map((item, index) => 
            <DashboardListItem
              item={item}
              key={index}
              index={index}
              toggleActiveDashboard={this.props.toggleActiveDashboard}
              dashboards={this.props.dashboards}
              datasets={this.props.datasets}
              visualisations={this.props.visualisations}
              isActive={this.itemIsActive(index)}
              />
      	)}
        </ul>
      </div>
    )
  }
  itemIsActive(index) {
    return parseInt(this.props.dashboards.activeDashboard) === parseInt(index);
  }
}

class DashboardListItem extends Component {
  render() {
    return (
      <li>
        <span
          style ={this.getStyle()}
          onClick={()=>this.toggleDashboard(this.props.index)}>
          {this.props.item.name} - ({this.props.item.visualisations.length} visualisations)
        </span>
        {this.props.isActive &&
          <DashboardGridLayout
            dashboard={this.props.item}
            datasets={this.props.datasets}
            visualisations={this.props.visualisations}
          />
        }
      </li>
    )
  }
  getStyle() {
    return {
      color: this.props.isActive ? 'red' : 'black',
      cursor: 'pointer',
      margin: '1em'
    };
  }
  toggleDashboard(id) {
    this.props.toggleActiveDashboard(id);
  }
}

class DashboardGridLayout extends Component {
  render() {
    return (
      <div>
        <p>In the future, this will show this Dashboard's visualisations on
        a drag-and-drop canvas. Unfortunately, as of 14/01/2016 the component
        'react-grid-layout' does not yet support React 0.14.x. The maintainer 
        has indicated that support will be added soon.</p>

        <p>In the meantime, here are a list of this dashboard's visualisations.</p>
        <div>
          {
            this.props.dashboard.visualisations.map((item, index) =>
            <VisualisationItem
              key={index}
              visualisation={this.getVisualisation(item)}
              datasets={this.props.datasets}
            />
            )
          }
        </div>
      </div>
    )
  }
  getVisualisation(item) {
    return this.props.visualisations.all[item];
  }
}