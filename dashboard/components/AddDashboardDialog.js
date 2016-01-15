import React, { Component, PropTypes } from 'react';
import VisualisationList from './VisualisationList'

export default class AddDashboardDialog extends Component { 
  render() {
    return (
      <div className='AddDashboardDialog' style={{
        backgroundColor: 'whitesmoke',
        padding: '1em'
      }}>
        <h3>Adding a new Dashboard</h3>
        <label htmlFor="dashboardName">Dashboard name:</label>
        <input type="text" id="dashboardName" ref="dashboardName" />
        <h4>Choose visualisations</h4>
        <ul>
        {
          this.props.visualisations.all.map(
            (item, index) =>
              <AddDashboardDialogItem
                key={index}
                index={index}
                item={item}
                toggleVisualisationToPendingDashboard={
                  (id) => this.props.toggleVisualisationToPendingDashboard(id)
                }
                />
          )
        }
        </ul>
        <button onClick={() => this.props.cancelAddDashboard()}>Cancel dashboard</button>
        <button onClick={() => this.confirmAddDashboard()}>Save dashboard</button>        
      </div>
    )
  }

  confirmAddDashboard() {
    var titleNode = this.refs.dashboardName;
    var title = titleNode.value.trim();
    
    this.props.confirmAddDashboard(title);
  }
}

class AddDashboardDialogItem extends Component {
  render() {
    return (
      <li key={this.props.index}>
        <input type="checkbox" 
        onChange={(event) => this.addPendingVisualisation(this.props.index)} />
        {this.props.item.name} ({this.props.item.type} chart)
      </li>
    )    
  }

  addPendingVisualisation(index) {
    this.props.toggleVisualisationToPendingDashboard(index);
  }  
}