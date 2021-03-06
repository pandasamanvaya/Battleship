import React,{ Component } from "react";
import Web3 from 'web3'
import {ButtonToolbar, Button} from "react-bootstrap";

class Board extends Component{
    constructor(){
        super();
        this.state = {winner:null,turn:null,filled:[],sent:false,other_done:false,guess:[],selection:1,boat_selected:undefined,vertical:false,boats:{PB:false,DT:false,SM:false,BS:false,AC:false}};
        this.createtable = this.createtable.bind(this);
        this.highlightCells = this.highlightCells.bind(this);
        this.selectBoat = this.selectBoat.bind(this);
        this.setBoat = this.setBoat.bind(this);
        this.rotateBoat = this.rotateBoat.bind(this);
        this.normalizeCells = this.normalizeCells.bind(this);
        this.sendBoard = this.sendBoard.bind(this);
        this.guessCell = this.guessCell.bind(this);
        this.setTurn = this.setTurn.bind(this);
    }

    highlightCells(event){
        var x = parseInt(event.target.attributes.x.nodeValue);
        var y = parseInt(event.target.attributes.y.nodeValue);
        event.target.style.background = 'white';
        if(this.state.vertical){
            var z = x+parseInt(this.state.selection);
            for(var i=x;i<z && i<10;i++){
                if(this.state.filled.indexOf(10*i+y)<0){
                    document.getElementById("board"+(10*i+y)).style.background = 'white';
                }
            }
        }
        else{
            z = y+parseInt(this.state.selection);
            for(var j=y;j<z && j<10;j++){
                if(this.state.filled.indexOf(10*x+j)<0){
                    document.getElementById("board"+(10*x+j)).style.background = 'white';
                }
            }
        }
    }

    normalizeCells(event){
        var x = parseInt(event.target.attributes.x.nodeValue);
        var y = parseInt(event.target.attributes.y.nodeValue);
        if(this.state.vertical){
            var z = x+parseInt(this.state.selection);
            for(var i=x;i<z && i<10;i++){
                if(this.state.filled.indexOf(10*i+y)<0){
                    document.getElementById("board"+(10*i+y)).style.background = '#007bff';
                }
                else{
                    document.getElementById("board"+(10*i+y)).style.background = 'red';
                }
            }
        }
        else{
            z = y+parseInt(this.state.selection);
            for(var j=y;j<z&& j<10;j++){
                if(this.state.filled.indexOf(x*10+j)<0){
                    document.getElementById("board"+(x*10+j)).style.background = '#007bff';
                }
                else{
                    document.getElementById("board"+(x*10+j)).style.background = 'red';
                }
            }
        }
    }

    setBoat(event){
        if(this.state.selection===1)
            return;
        if(this.state.boats[this.state.boat_selected])
            return;
        var x = parseInt(event.target.attributes.x.nodeValue);
        var y = parseInt(event.target.attributes.y.nodeValue);
        if(this.state.vertical){
            var z = x+parseInt(this.state.selection);
            if(z<=10){
                for(let i=x;i<z;i++){
                    if(this.state.filled.indexOf(10*i+y)>0){
                        return;
                    }
                }
                for(let i=x;i<z;i++){
                    document.getElementById("board"+(10*i+y)).style.background = 'red';
                    let filled = this.state.filled;
                    filled.push(10*i+y);
                    this.setState({filled:filled});
                }
                let boats = this.state.boats;
                boats[this.state.boat_selected]=true;
                this.setState({boats:boats,selection:1,boat_selected:undefined});
            }   
        }
        else{
            z = y+parseInt(this.state.selection);
            if(z<=10){
                for(let j=y;j<z;j++){
                    if(this.state.filled.indexOf(x*10+j)>0){
                        return;
                    }
                }
                for(let j=y;j<z;j++){
                    document.getElementById("board"+(x*10+j)).style.background = 'red';
                    let filled = this.state.filled;
                    filled.push(x*10+j);
                    this.setState({filled:filled});
                    console.log(this.state.filled);
                }
                let boats = this.state.boats;
                boats[this.state.boat_selected]=true;
                this.setState({boats:boats,selection:1,boat_selected:undefined});
            }
        }
    }

    selectBoat(event){
        this.setState({selection:parseInt(event.target.value),boat_selected:event.target.attributes.boat.nodeValue});
    }

    rotateBoat(event){
        this.setState({vertical:!(this.state.vertical)});
        console.log(this.state.vertical);
    }

    sendBoard(event){
        let web3 = new Web3('ws://127.0.0.1:8545');
        let contract = new web3.eth.Contract(JSON.parse(sessionStorage.getItem('abi')),sessionStorage.getItem('address'));
        console.log(this.state.filled.sort());
        contract.methods.initialize_board(this.state.filled.sort(),sessionStorage.getItem('salt')).send({from:sessionStorage.getItem('account'),gas:4712388})
        .then((res)=>{console.log(res); this.setTurn();});      
    }

    guessCell(event){
        var x = parseInt(event.target.attributes.x.nodeValue);
        var y = parseInt(event.target.attributes.y.nodeValue);
        let web3 = new Web3('ws://127.0.0.1:8545');
        let contract = new web3.eth.Contract(JSON.parse(sessionStorage.getItem('abi')),sessionStorage.getItem('address'));
        contract.methods.commit_move(x,y).send({from:sessionStorage.getItem('account')});
        this.setTurn();
    }

    setTurn(){
        let web3 = new Web3('ws://127.0.0.1:8545');
        let contract = new web3.eth.Contract(JSON.parse(sessionStorage.getItem('abi')),sessionStorage.getItem('address'));
        contract.methods.getTurn().call()
        .then((res)=>{
            this.setState({turn:res});
        });
    }

    createtable(name){
        let table = []
        // Outer loop to create parent
        for (let i = 0; i < 10; i++) {
            let children = []
            //Inner loop to create children
            for (let j = 0; j < 10; j++) {
                if(name === "board"){
                    children.push(<Button onClick={this.setBoat} onMouseEnter={this.highlightCells} onMouseLeave={this.normalizeCells} id={`${name}${i*10+j}`} x={`${i}`} y={`${j}`}>~</Button>)
                }
                else{
                    children.push(<Button onClick={this.guessCell} id={`${name}${i*10+j}`} x={`${i}`} y={`${j}`}>~</Button>)
                }
            }
            //Create the parent and add the children
            table.push(<ButtonToolbar aria-label="Toolbar with button groups">{children}</ButtonToolbar>)
        }
        return table
    }

    componentDidMount(){
        let web3 = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8545'));
        let contract = new web3.eth.Contract(JSON.parse(sessionStorage.getItem('abi')),sessionStorage.getItem('address'));
        this.setTurn();

        contract.events.PlayerMadeAHit((error, event)=>{ this.setTurn();console.log(event); })
        .on('data', (event)=>{
            this.setTurn();
            console.log(event.returnValues);
            if(event.returnValues['player']===sessionStorage.getItem('account'))
                return;
            let x = parseInt(event.returnValues['x']);
            let y = parseInt(event.returnValues['y']);            
            let status = event.returnValues['status'];
            if(status==="Hit"){
                document.getElementById("guess"+(10*x+y)).style.backgroundColor = 'yellow';
            }
            else{
                document.getElementById("guess"+(10*x+y)).style.backgroundColor = 'red';
            }
            let guesses = this.state.guess;
            guesses.push(10*x+y); 
            this.setState({guess:guesses});
        });

        contract.events.PlayerMadeMove((error,event)=>{console.log(event);})
        .on('data',(event)=>{
            this.setTurn();
            console.log(event.returnValues);
            if(event.returnValues['player']===sessionStorage.getItem('account'))
                return;
            
            let x = parseInt(event.returnValues['x']);
            let y = parseInt(event.returnValues['y']);   
            web3 = new Web3( new Web3.providers.WebsocketProvider('ws://localhost:8545'));
            contract = new web3.eth.Contract(JSON.parse(sessionStorage.getItem('abi')),sessionStorage.getItem('address'));             
            contract.methods.reveal_move(x,y,sessionStorage.getItem('salt')).send({from:sessionStorage.getItem('account'), gas:4712388});
        });
        contract.events.GameWinner((error,event)=>{console.log(event);})
        .on('data',(event)=>{
            console.log(event.returnValues);
            let winner = event.returnValues['winner'];
            if(winner==="0x0000000000000000000000000000000000000000")
                return;
            sessionStorage.removeItem('address');
			sessionStorage.removeItem('abi');
			this.setState({winner:winner});
        });
    }

    render(){
        if(!this.state.winner){
            return(
                <div className="container">
                    <div className="row">
                        <div className="col-6">
                            <p>{this.state.turn}</p>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-6">
                            {this.createtable("board")}
                        </div>
                        <br></br>
                        <div className="col-6">
                            {this.createtable("guess")}
                        </div>
                    </div>
                    <br></br>
                    <div className="row">
                        <div className="col-md-6">
                            <ul className="list-inline">
                                <li className="list-unstyled list-inline-item" onClick={this.selectBoat}><Button variant="secondary" value={2} boat="PB">Patrol Boat</Button></li>
                                <li className="list-unstyled list-inline-item" onClick={this.selectBoat}><Button variant="secondary" value={3} boat="SM">Submarine</Button></li>
                                <li className="list-unstyled list-inline-item" onClick={this.selectBoat}><Button variant="secondary" value={3} boat="DT">Destroyer</Button></li>
                                <li className="list-unstyled list-inline-item" onClick={this.selectBoat}><Button variant="secondary" value={4} boat="BS">Battleship</Button></li>
                                <li className="list-unstyled list-inline-item" onClick={this.selectBoat}><Button variant="secondary" value={5} boat="AC">Aircraft Carrier</Button></li>
                                <li className="list-unstyled list-inline-item"><Button variant="success" onClick={this.rotateBoat}>Rotate</Button></li>
                                { this.state.filled.length === 17 &&
                                    <li className="list-unstyled list-inline-item" onClick={this.sendBoard}><Button variant="warning">Join a game</Button></li>
                                }
                            </ul>
                        </div>
                    </div>
                </div>
            );
        }
        else{
            return(
            <p>Winner is {this.state.winner}</p>
            )
        }
    }
}
export default Board;