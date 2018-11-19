import React, { Component } from 'react'
import './Sidebar.css'

import axios from 'axios'
import {connect} from 'react-redux'
import {updateUser, logoutUser, updateCurrentList, updateClientModal, updateProps} from '../../redux/reducer'
import Modal from 'react-responsive-modal'
import Input from '@material-ui/core/Input'
import flow from 'lodash/flow'
import ListItem from './ListItem'
import HTML5Backend from 'react-dnd-html5-backend'
import {DragDropContext} from 'react-dnd'
const update = require('immutability-helper')


class Sidebar extends Component {
  
  constructor(){
    super()
    this.state = {
      open: false,
      lists: [],
      listName: '',
      optionsMenu: false,
      deleteListCheck: false,
      listInEdit: {}
    }

    //If options menu is open, but user clicks away--close menu.
    window.addEventListener("click", (event) => {
      if(event.target.id !== 'menu-icon' && this.state.optionsMenu){
          this.setState({optionsMenu: false}) 
      }
    });
  }

  
  componentDidMount(){
    axios.get('/api/user-info').then( res => {
      const {lists} = res.data

      this.setState({ lists }) 
      this.props.updateUser(res.data)

      if(lists[0]){
            if(lists[0].list_id){
              let id = lists[0].list_id
              this.props.updateCurrentList( {listId: id} )
            }
      }
     
    }).catch(error => {
      //If 500 error with no user, redirect to home page. 
      this.props.history.push('/')
    })
  }

  moveListItem = (dragIndex, hoverIndex) => {
		const { lists } = this.state
    const dragList = lists[dragIndex]
    
		this.setState(
			update(this.state, {
				lists: {
					$splice: [[dragIndex, 1], [hoverIndex, 0, dragList]],
				},
			}),
    )

    lists[dragIndex]["index_id"] = hoverIndex
    lists[hoverIndex]["index_id"] = dragIndex

    let dragId = lists[dragIndex]["list_id"]
    let hoverId = lists[hoverIndex]["list_id"]

    let swap = { dragId, hoverId, dragIndex, hoverIndex}

    axios.post('/api/changelistorder', {swap} )
    
	}

  saveList = () => {
    const {listName} = this.state

    if(this.state.listInEdit.list_name){
        const {index, list_id} = this.state.listInEdit
        axios.put('/api/updatelist', {list_id, listName}).then(() => {
          let newList = this.state.lists
          let updatedListItem = this.state.lists[index]
         
          updatedListItem["list_name"] = listName
          newList.splice(index, 1, updatedListItem)
       
          this.setState({open: false, lists: newList, listInEdit: {}, listName: ''})
          this.props.updateProps({lists: newList, listId: -1})
          this.props.updateProps({listId: list_id})
        })
    }
    else {

    axios.post('/api/addlist', {listName}).then(response => {
      let newList = response.data[0]
      let updatedList = this.state.lists
      updatedList.push(newList)
      this.setState({open: false, lists: updatedList})
      //TODO: Update lists in props
    })
  }
  }

  updateCurrentList = (id) => {
      this.props.updateCurrentList( {listId: id} )
  }

  openClient = () => {
    axios.get('/api/getsessiontypes').then(response => {
      //If user has no session types, they can't add a client. 
      //If user has no lists, they can't add clients. 
        if(response.data[0]){
            if(response.data[0].session_id !== null){
                if(this.props.lists[0]){
  
                  this.setState({
                    sessionTypes: response.data,
                    sessionPrice: response.data[0].session_price
                  })

                  this.props.updateClientModal({
                    clientModalOpen: true
                    // sessionTypes: response.data,
                    // sessionPrice: response.data[0].session_price
                  })
  
                }
            
          }
        }
        //TODO: Different alert statements for no client list or no sessions. 
        else {
        alert("You'll first want to head over to Settings > Sessions and add a few session types.")
             }
        })
  }

  clickList = (list) => {
    this.updateCurrentList(list.list_id)
    
        if(this.props.match.path !== '/dashboard'){
          this.props.history.push('/dashboard')
        }
  }

  optionsMenu = () => {
    this.setState({ optionsMenu: !this.state.optionsMenu })
  }

  deleteListCheck = (list, index) => {
    let listWithIndex = {...list, ...{ index } }
    this.setState({ listInEdit: listWithIndex, deleteListCheck: true })
  }

  updateList = (list, index) => {
    const {list_name} = list
    let listWithIndex = {...list, ...{index} }
    this.setState({open: true, listName: list_name, listInEdit: listWithIndex})
  }

  deleteList = () => {
    const {index, list_id} = this.state.listInEdit
    
      axios.delete(`/api/deletelist/${list_id}`).then(() => {
      let newList = this.state.lists
      newList.splice(index, 1)
      this.setState({deleteListCheck: false, lists: newList, listInEdit: {}, listName: '' })
      this.props.updateProps({listId: -1})
      })

  }

  showAllClients = () => {
    this.updateCurrentList(-1)

    if(this.props.match.path !== '/dashboard'){
      this.props.history.push('/dashboard')
    }
  }

  logOut = () => {
    axios.post('/api/logout').then(() => {
      this.props.logoutUser()
      this.props.history.push('/')
    })
  }

  

  render() {
    const isEditing = this.state.optionsMenu ? 'flex' : 'none'
    return (
        <div className="sidebar">

          <div className="topbar">
          <img 
          className="profileimage"
          src={this.props.picture} 
          alt="profile"/>
          <i 
          onClick={() => this.logOut()}
          className="fas fa-sign-out-alt"/>

        {/* Normally I'd use Link. But props is not updating location. Currently reviewing MJacksons notes on blocked location props.  */}
        
         <i onClick={() => this.props.history.push('/settings')}
         className="fas fa-cog"/>
          </div>

          <div className="menuitem"
          onClick={this.showAllClients}>

            <p><i className="fas fa-users"/>Clients</p>
            <i onClick={() => this.setState({open: true})}
            className="fas fa-plus-circle add-icon menu-icon"/>

          </div>

          {this.props.lists.map((e,i) => {
        //If propsId is itemId, this list is currently selected.
            
            if(this.props.listId===e.list_id){
              return (
                <div key={e.list_id}>
                <ListItem
                item={e}
                index={i}
                id={e.list_id}
                active={true}
                clickList={this.clickList}
                openClient={this.openClient}
                moveListItem={this.moveListItem}
                optionsMenu={this.optionsMenu}
                />
                <div className="options-menu" 
                style={{ display: isEditing }}>
                <p onClick={() => this.updateList(e, i)}
                ><i className="far fa-edit"/>edit</p>
                <p onClick={() => this.deleteListCheck(e, i)}
                ><i className="far fa-trash-alt"/>delete</p>
                </div>
                </div>
              )
            }
            else {
              return (
               <ListItem
               item={e}
               index={i}
               id={e.list_id}
               key={e.list_id}
               active={false}
               clickList={this.clickList}
               moveListItem={this.moveListItem}
               />
              )
            }

          })}

          {/* Modal to Add List or Edit Previous List */}
          <Modal open={this.state.open} 
          onClose={() => this.setState({open: false, listName: '', listInEdit: {} })} center>
          {this.state.listInEdit.list_name ? 
          <h3 className='modal-title'>Update List</h3>
           :
           <h3 className='modal-title'>
           <i className="fas fa-users"/> Add Client List
           </h3>}

          <Input
          className="clientinput"
          placeholder="Client List Name"
          autoFocus={true}
          value={this.state.listName}
          onChange={e => this.setState({listName: e.target.value})}/>

          <div className="list-modal">

          <button type="button" className="btn btn-primary save full" onClick={this.saveList}>
          {this.state.listInEdit.list_name ? 
          'Save List' : '+ Add List'}
          </button>

          </div>

          </Modal>

         {/* Modal to check if user wants to delete list */}
           <Modal open={this.state.deleteListCheck} 
          onClose={() => this.setState({deleteListCheck: false, listName: '', listInEdit: {} })} center>
            <h3 className='modal-title'> 
            Delete {this.state.listInEdit.list_name}?
            </h3>
            <div className="list-modal">
            <p>All Clients will be deleted.</p>

            <button type="button" className="btn btn-danger save full" onClick={this.deleteList}>Delete List</button>
            </div>
          </Modal>

        </div>
    )
  }
}

function mapStateToProps(state){
  return {
    ...this.props, ...state
  }
}

export default flow(
  DragDropContext(HTML5Backend),

  connect(mapStateToProps, {updateUser, logoutUser, updateCurrentList, updateClientModal, updateProps})

)(Sidebar)