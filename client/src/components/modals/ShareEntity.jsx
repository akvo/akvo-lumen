import React, { Component, PropTypes } from 'react';
import Modal from 'react-modal';
import fetch from 'isomorphic-fetch';
import headers from '../../actions/headers';
require('../../styles/DashboardModal.scss');
require('../../styles/ShareEntity.scss');


export default class ShareEntity extends Component {

  constructor() {
    super();
    this.state = { shareId: '' };
    this.fetchShareId = this.fetchShareId.bind(this);
  }

  fetchShareId() {
    const { id } = this.props.entity;
    if (id != null) {
      fetch(`/api/share/${id}`, {
        method: 'POST',
        headers: headers(),
      })
      .then(response => response.json())
      .then(({ shareId }) => this.setState({ shareId }))
      .catch(error => console.error(error));
    }
  }

  render() {
    const { entity, onClose } = this.props;
    const { type, name } = entity;
    return (
      <Modal
        isOpen={this.props.isOpen}
        onAfterOpen={this.fetchShareId}
        style={{
          content: {
            width: 500,
            height: 300,
            marginLeft: 'auto',
            marginRight: 'auto',
            borderRadius: 0,
            border: '0.1rem solid rgb(223, 244, 234)',
          },
          overlay: {
            zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.6)',
          },
        }}
      >
        <div className="DashboardModal">
          <div className="ShareEntity">
            <h2 className="modalTitle">{`Share ${type} "${name}"`}</h2>
            <div
              className="close clickable"
              onClick={onClose}
            >
              +
            </div>
            <div className="contents">
              <label htmlFor="nameInput">Share {type} {name}</label>
              <input
                id="nameInput"
                onChange={this.handleInputChange}
                type="text"
                value={this.state.shareId}
              />
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

ShareEntity.propTypes = {
  onClose: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  entity: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
  }).isRequired,
};
