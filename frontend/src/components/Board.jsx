import React,{ Component } from "react";
import {ButtonToolbar, Button} from "react-bootstrap";

class Board extends Component{
    constructor(){
        super();
        this.state = {guess:new Array(10).fill(new Array(10).fill('~')),selection:1,boat_selected:undefined,vertical:false,boats:{PB:false,DT:false,SM:false,BS:false,AC:false}};
        this.createtable = this.createtable.bind(this);
        this.highlightCells = this.highlightCells.bind(this);
        this.selectBoat = this.selectBoat.bind(this);
        this.setBoat = this.setBoat.bind(this);
        this.rotateBoat = this.rotateBoat.bind(this);
        this.normalizeCells = this.normalizeCells.bind(this);
    }

    highlightCells(event){
        var x = parseInt(event.target.attributes.x.nodeValue);
        var y = parseInt(event.target.attributes.y.nodeValue);
        event.target.style.background = 'white';
        if(this.state.vertical){
            var z = x+parseInt(this.state.selection);
            for(var i=x;i<z && i<10;i++){
                if(document.getElementById("board"+(10*i+y)).style.background!=="red"){
                    document.getElementById("board"+(10*i+y)).style.background = 'white';
                }
            }
        }
        else{
            z = y+parseInt(this.state.selection);
            for(var j=y;j<z && j<10;j++){
                if(document.getElementById("board"+(10*x+j)).style.background!=='red'){
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
                if(document.getElementById("board"+(10*i+y)).style.background !== 'red'){
                    document.getElementById("board"+(10*i+y)).style.background = '#007bff';
                }
            }
        }
        else{
            z = y+parseInt(this.state.selection);
            for(var j=y;j<z&& j<10;j++){
                if(document.getElementById("board"+(x*10+j)).style.background!=="red"){
                    document.getElementById("board"+(x*10+j)).style.background = '#007bff';
                }
            }
        }
    }

    setBoat(event){
        if(this.state.boats[this.state.boat_selected])
            return;
        var x = parseInt(event.target.attributes.x.nodeValue);
        var y = parseInt(event.target.attributes.y.nodeValue);
        if(this.state.vertical){
            var z = x+parseInt(this.state.selection);
            if(z<10){
                for(var i=x;i<z;i++){
                    document.getElementById("board"+(10*i+y)).style.background = 'red';
                }
                let boats = this.state.boats;
                boats[this.state.boat_selected]=true;
                this.setState({boats:boats,selection:1,boat_selected:undefined});
            }   
        }
        else{
            z = y+parseInt(this.state.selection);
            if(z<10){
                for(var j=y;j<z;j++){
                    document.getElementById("board"+(x*10+j)).style.background = 'red';
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
                    children.push(<Button onClick={this.guess} id={`${name}${i*10+j}`} x={`${i}`} y={`${j}`}>{this.state.guess[i][j]}</Button>)
                }
            }
            //Create the parent and add the children
            table.push(<ButtonToolbar aria-label="Toolbar with button groups">{children}</ButtonToolbar>)
        }
        return table
    }

    render(){
        return(
            <div className="container">
                <div className="row">
                    <div className="col-md-8">
                        {this.createtable("board")}
                    </div>
                    <div className="col-md-4">
                        <ul>
                            <li className="list-unstyled" onClick={this.selectBoat}><Button variant="danger" value={2} boat="PB">Patrol Boat</Button></li>
                            <li className="list-unstyled" onClick={this.selectBoat}><Button variant="danger" value={3} boat="SM">Submarine</Button></li>
                            <li className="list-unstyled" onClick={this.selectBoat}><Button variant="danger" value={3} boat="DT">Destroyer</Button></li>
                            <li className="list-unstyled" onClick={this.selectBoat}><Button variant="danger" value={4} boat="BS">Battleship</Button></li>
                            <li className="list-unstyled" onClick={this.selectBoat}><Button variant="danger" value={5} boat="AC">Aircraft Carrier</Button></li>
                            <li className="list-unstyled"><Button variant="success" onClick={this.rotateBoat}>Rotate</Button></li>
                        </ul>
                    </div>
                </div>
                <br></br>
                <div className="row">
                    <div className="col-md-8">
                        {this.createtable("guess")}
                    </div>
                </div>
            </div>
        );
    }
}
export default Board;