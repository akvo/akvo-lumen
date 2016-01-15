import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';

export default class Navigation extends Component {
  render() {
    const currentLocation = this.props.router.location.pathname;
    return (
      <div>
        <NavigationLink
          to={'/datasets'}
          text='Datasets'
          currentLocation={currentLocation} />
        <NavigationLink
          to={'/visualisations'}
          text='Visualisations'
          currentLocation={currentLocation}
          count={this.props.visualisations.all} />
        <NavigationLink
          to={'/dashboards'}
          text='Dashboards'
          currentLocation={currentLocation}
          count={this.props.dashboards.all} />
      </div>
    )
  }
}

class NavigationLink extends Component {
  render() {
    const active = this.props.to === this.props.currentLocation;
    return (
      <Link to={this.props.to}
        style={{
          color: active ? 'red' : 'black',
          margin: '10px'
        }}>
        {this.props.text}
        {this.props.count &&
          <span> ({this.props.count.length})</span>
        }
      </Link>
    )
  }
}