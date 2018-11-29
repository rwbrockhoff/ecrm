import React, { Component } from 'react'
import './ClientModal.css'
import ClientActions from './ClientActions'
import LocationSearch from './LocationSearch'
import Modal from 'react-responsive-modal'
import Input from '@material-ui/core/Input'
import TextField from '@material-ui/core/TextField'
import {connect} from 'react-redux'
import {updateClientModal} from '../../../redux/reducer'
import axios from 'axios'


class ClientModal extends Component {
    constructor(){
        super()
        
        this.state = {
            sessionTypes: [],
            sessionIndex: 0,
            price: '',
            sessionId: '',
            listId: null,
            clientName: '',
            clientEmail: '',
            clientDate: '2019-06-10',
            clientLocation: '',
            clientState: '',
            clientCountry: '',
            togglePriceEdit: false
        }

    }

    componentDidMount(){
        this.getSessions()
    }

    componentDidUpdate(prevProps){
        if(prevProps !== this.props){

            const {newClient} = this.props.clientSettingsModal
            this.getSessions()

            if(newClient === false){
                this.convertDateToMUI()
                this.isEditingClient()
            }
            
            if(newClient === true){
                    this.setState({
                        sessionTypes: [],
                        sessionIndex: 0,
                        price: 0,
                        sessionId: '',
                        clientName: '',
                        clientEmail: '',
                        clientDate: '2019-06-10',
                        clientLocation: '',
                        togglePriceEdit: false
                    })  
            }
            
        } 
    }

    getSessions = () => {
        axios.get('/api/getsessiontypes').then(response => {
            const sessions = response.data
           
            //If user has no session types, they can't add a client. 
            //If user has no lists, they can't add clients. 
            if(sessions[0]){
                  if(sessions[0].session_id !== null){
                      if(this.props.lists){
                        this.setState({
                          sessionTypes: sessions,
                          sessionIndex: 0,
                          sessionId: sessions[0]["session_id"],
                          price: sessions[0]["session_price"],
                          listId: this.props.listId
                        })
                      }       
                  }
              }

            //If user is editing a previous client, update State to reflect their sessionPrice--not the default session price.
            const {newClient} = this.props.clientSettingsModal
            
            if(newClient === false){
                 this.isEditingClient()
            }
            else {
                if(!this.props.clients[0]){
            //TODO: Properly resolve if no sessions/lists
                //     if(!this.props.clients[0]["client_id"]){
                //     alert("You'll first want to head over to Settings > Sessions and add a few session types.")
                // }
            }
         }
        })
    }

    isEditingClient = () => {
       //Updates local state with Client variables, if editing.
        const {name, client_email, location, session_price, session_id} = this.props.clientSettingsModal.client.client
       
        this.setState({
            clientName: name,
            clientEmail: client_email,
            clientLocation: location,
            price: session_price,
            sessionId: session_id
        })
    }

    sessionPriceUpdater = (index) => {
        const {sessionTypes} = this.state
        this.setState({
          sessionIndex: index,
          sessionId: sessionTypes[index]["session_id"],
          price: sessionTypes[index]["session_price"]
        })
      }

    
      saveClient = () => {
        const {newClient} = this.props.clientSettingsModal
        let date = this.convertDate()
        
        var clientInfo = {
            name: this.state.clientName,
            client_email: this.state.clientEmail,
            date: date,
            location: this.state.clientLocation,
            clientState: this.state.clientState,
            clientCountry: this.state.clientCountry,
            session_price: this.state.price,
            list_id: this.state.listId
        }

        //If user didn't use dropdown, alert them to use dropdown.
        if(!this.state.clientState){
            alert('Please use the Google Search Selection for your locations! This ensures we can collect state + country information for tax purposes.')
            return
        }
       
        if(!newClient){
            //Editing and saving client if Id is stored in props.
            const { client_id, session_id } = this.props.clientSettingsModal.client.client
            
            var index = this.getIndex(client_id)
            var current = this.props.currentActions

            var clientOldActions = this.props.clients[index]["actions"]
            var sameValues = compareValues(clientOldActions, current)

            clientInfo["client_id"] = client_id
            clientInfo["session_id"] =  session_id
            clientInfo["actions"] = current

            var newClientObj = Object.assign({}, this.props.clients[index], clientInfo)

            var allClients = (() => {
                let prevClients = this.props.clients.slice()
                prevClients[index] = newClientObj
                return prevClients
            })()
            
           if(sameValues){
               delete clientInfo.actions
            axios.put('/api/updateclient', {clientInfo} )
             .then( () => this.clearForm(allClients) )
            }

            else {
                axios.put('/api/updatefullclient', {clientInfo} )
                .then( (response) => {
                    let newActions = response.data.actions[0]
                    let actionInfo = {newActions, session_id}
                    this.clearForm(allClients, actionInfo) 
                })
            }

            function compareValues(obj, otherObj){
                if(obj.length !== otherObj.length) return false
                
                for(let i = 0; i < obj.length; i++){
                    if(typeof obj[i] === "string"){
                        if(obj[i] !== otherObj[i].name){
                            return false
                        }
                    }
                    else {
                        if(obj[i].name !== otherObj[i].name){
                            return false
                        }
                    }
                }
                    return true
                }  
            }

        else {
            //Client added to DB. Receive new Client (w/ ID) and client's actions. Updating front end via props.
            // session_name, session_color, actions, session_price
            const {session_name, session_color, actions} = this.state.sessionTypes[this.state.sessionIndex]
            
            clientInfo["session_name"] = session_name
            clientInfo["session_color"] = session_color
            clientInfo["actions"] = actions

            axios.post('/api/addclient', {clientInfo} ).then( response => {
                var allClients = this.props.clients
                var newClient = response.data.client[0]
                allClients.unshift(newClient)

                const {session_id} = response.data.client[0]
                var allActions = this.props.actions
                var Id = String(session_id)
                allActions[Id] = { actions: response.data.actions[0]["actions"] }

                this.props.updateClientModal({
                    clientModalOpen: false,
                    clients: allClients, 
                    actions: allActions
                })
            })
        }
 
    }

    //Convert Material UI format to display format for User.
    //TODO: Use regex to remove front zero
    convertDate = () => {
        let date = this.state.clientDate.split('-')
        let year = date.shift()
        date.push(year)
        date = date.join('/')
        return date
    }

    //Convert DB date to MUI for user display.
    convertDateToMUI = () => {
        let clientDate = this.props.clientSettingsModal.client.client.date
        var newString = clientDate.replace(/[/]+/g, "-").split('-')
        var year = newString.pop()
        newString.unshift(year)
        newString = newString.join("-")

        this.setState({clientDate: newString})
    }

    updateLocation = (locationInfo) => {
        console.log('locationInfo: ', locationInfo)
        const {address, state, country} = locationInfo
        this.setState({
            clientLocation: address,
            clientState: state,
            clientCountry: country
        })
    }

    getIndex = (id) => {
        let index; 
        this.props.clients.map((e,i) => {
            if(e.client_id === id){
                index = i
            }
        })
        return index
    }

    clearForm = (newClientList, actionInfo) => {
    //If we changed Client Actions, update Props.Actions with new items. Else just update Props.Clients. 
        if(actionInfo){
            const {newActions, session_id} = actionInfo
            let allActions = (() => {
                let prevActions = Object.assign({}, this.props.actions)
                prevActions[session_id] = newActions
                return prevActions
            })()
            this.props.updateClientModal({
                clientModalOpen: false,
                clientSettingsModal: { open: false, newClient: true, client: {} },
                clients: newClientList,
                actions: allActions
            })
        }
        else {
            this.props.updateClientModal({
                clientModalOpen: false,
                clientSettingsModal: { open: false, newClient: true, client: {} },
                clients: newClientList
            })
        }
        
    }

    closeAndResetModal = () => {
        this.props.updateClientModal({
            clientSettingsModal: {open: false, newClient: true, client: {}},
            clientModalOpen: false,
        })                           
    }

    toggleEdit = () => {
        this.setState({togglePriceEdit: !this.state.togglePriceEdit})
    }

    
  render() {
      const {newClient, client} = this.props.clientSettingsModal
      const isEditing = newClient ? 
      '' : 'client-modal-container'

    return (
        <Modal 
        open={this.props.clientModalOpen} 
        onClose={this.closeAndResetModal} center>
    
        <h3 className="title">
        <i className="far fa-user-circle"/>
        {newClient ?  "Add Client" : `Edit ${client.client.name}`}
        </h3>
    <div className={isEditing}>
        <div className="addclientmodal">
              <Input
              autoFocus={true}
              className="clientinput"
              placeholder="Client's Name"
              defaultValue={this.state.clientName}
              onChange={e => this.setState({clientName: e.target.value})}/>

              <Input
              className="clientinput"
              placeholder="Client's Email"
              defaultValue={this.state.clientEmail}
              onChange={e => this.setState({clientEmail: e.target.value})}/>
    
        
        {/* If new client, select menu for choosing session type. If editing client, select menu for changing lists. Ternary "selected" value sets default to current list for client. */}

          {newClient ? 
                <select className="sessionmenu" 
                onChange={e => this.sessionPriceUpdater(e.target.value)}>
                        {this.state.sessionTypes.map( (e,i) => {
                        return (
                            <option value={i} key={e.session_id}>      
                            {e.session_name} 
                            </option>
                            )
                        })}      
                </select> 
            :
            <select className="sessionmenu" 
            onChange={e => this.setState({listId: parseInt(e.target.value)})}>
                        {this.props.lists.map(e => {
                            return e.list_id === this.props.listId ? 
                            <option value={e.list_id} key={e.list_id} selected="selected">
                                {e.list_name} 
                            </option>
                            :
                            <option value={e.list_id} key={e.list_id}>      
                            {e.list_name} 
                            </option>
                        })}      
            </select>
          }

            <TextField
            id="date"
            label="Date"
            type="date"
            defaultValue={this.state.clientDate}
            onChange={e => this.setState({clientDate: e.target.value})}
            InputLabelProps={{
            shrink: true, }} />


            <LocationSearch
            updateLocation={this.updateLocation}
            location={this.state.clientLocation}/>
          

            {this.state.togglePriceEdit ? 

            <Input className="clientinput"
            placeholder={this.state.price}
            autoFocus={true}
            defaultValue={this.state.price}
            onBlur={this.toggleEdit}
            onChange={e => this.setState({price: e.target.value})}/>
            :
            <div className="clientprice" onClick={this.toggleEdit}> 
             {this.state.price}
            </div> 
            
            }                  
        </div>
    
         {/* Session Actions DnD */}
            {/* If editing a client, render ClientActions */}
            
            {
               ( () => {
                    if(!newClient){
                    return (
                    <div className="action-panel">
                        <ClientActions/>
                    </div>
                      )
                    }   
                } )()
            }
            
        {/* Session Actions DnD */}

        </div>

            <footer>
                <button type="button" 
                className="btn btn-primary save full" 
                onClick={this.saveClient}>

                {newClient ? "+ Add Client" : "Save Client"}

                </button>
            </footer>
    
        </Modal>
    )
  }
}

function mapStateToProps(state){
    return {
        ...this.props, ...state
    }
}

export default connect(mapStateToProps, {updateClientModal})(ClientModal)