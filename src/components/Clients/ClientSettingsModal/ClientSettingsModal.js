import React, { Component } from 'react'
import './ClientSettingsModal.css'
import Modal from 'react-responsive-modal'
import {connect} from 'react-redux'
import {updateClientSettingsModal, updateClientModal} from '../../../redux/reducer'
import axios from 'axios';

class ClientSettingsModal extends Component {
  constructor(){
    super()
      this.state = {
        deleteVerifyOpen: false
      }
  }


  closeModal = () => {
    this.props.updateClientSettingsModal({ 
      clientSettingsModal: {open: false, client: {}}
    })
  }

  closeDeleteModal = () => {
    this.setState({deleteVerifyOpen: false})
  }


  updateClient = () => {
    this.props.updateClientModal({clientModalOpen: true})
  }


  deleteClient = () => {
    const {clientId} = this.props.clientSettingsModal.client

    axios.delete(`/api/deleteclient/${clientId}`).then(() => {
      this.closeDeleteModal()
      this.closeModal()
    })
  }
    
  render() {
    return (
        <Modal 
        open={this.props.clientSettingsModal['open']} 
        onClose={this.closeModal} center>

          <h1 className="client-settings-modal-title">
          <i className="far fa-user"/>{this.props.clientSettingsModal.client.name}
          </h1>

          <div className="client-options">

                <button type="button" 
                className="btn btn-primary options"
                onClick={this.updateClient}>Update</button>

                 <button type="button" 
                 className="btn btn-danger options"
                onClick={() =>  
                  this.setState({deleteVerifyOpen: true})}>Delete</button>

          </div>

          <Modal open={this.state.deleteVerifyOpen}
          onClose={() => this.setState({deleteVerifyOpen: false})}>

                  <div className="client-options">
                    <h1 className="client-settings-modal-title">
                    Are you sure?
                    </h1> 

                    <button type="button" 
                 className="btn btn-danger options"
                onClick={this.deleteClient}>
                  Yes, Delete {this.props.clientSettingsModal.client.name}
                  </button>
                  </div>

          </Modal>

        </Modal>
    )
  }
}


function mapStateToProps(state){
  return {
    ...this.props, ...state
  }
}

export default connect(mapStateToProps, {updateClientSettingsModal, updateClientModal})(ClientSettingsModal)