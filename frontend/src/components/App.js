import React, {Component} from 'react';
import './App.css';
import Web3 from 'web3'
import Board from './Board';
import {Button} from "react-bootstrap";

class App extends Component {
  componentDidMount() {
    console.log(Web3.givenProvider);
    var state = {account:null, abi:null, contract:null}
    if(sessionStorage.getItem('account')){
      state['account'] = sessionStorage.getItem('account');
    }
    else if(Web3.givenProvider){
      const web3 = new Web3(Web3.givenProvider);
      web3.eth.getAccounts().then((accounts)=>{
        sessionStorage.setItem('account',accounts[0]);
        this.setState({account:accounts[0]});  
      });
    }
    if(sessionStorage.getItem('address')){
      state['address'] = sessionStorage.getItem('address');
    }
    this.setState(state);
  }

  async getNewContract(event) {
    event.preventDefault();
    fetch("http://127.0.0.1:8000/ttt/"+sessionStorage.getItem('account'),{
      method:"GET",
      headers: {
        "Access-Control-Allow-Origin":"*"
      },
    })
    .then(res=>res.json())
    .then((res)=>{
      console.log(res);
      sessionStorage.setItem('address',res["address"]);
      sessionStorage.setItem('abi',JSON.stringify(res["abi"]));
      var state = this.state;
      state['address'] = res["address"];
      this.setState(state);
      this.startGame();
    });
  }

  async getAccount(){
    const web3 = new Web3("ws://127.0.0.1:8545");
    const accounts = await web3.eth.getAccounts()
    const accountnumber = Math.floor(Math.random()*9+1);
    sessionStorage.setItem('account',accounts[accountnumber]);
    var state = this.state;
    state["account"] = accounts[accountnumber];
    this.setState(state);
  }

  constructor(props) {
    super(props);
    this.state = {account:null,address:null,abi:null};
  }

  render() {
    if(!this.state.account){
      return <Button variant="primary" onClick={this.getAccount}>Get Dummy Account</Button>
    }
    else{
      return (
        <div className="container">
          <h1>Hello, World!</h1>
          <p>Your account: {this.state.account}</p>
          <Board/>
        </div>
      );
    }
  }
}

export default App;
