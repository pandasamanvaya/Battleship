import React,{ Component } from "react";

class Board extends Component{
    constructor(){
        super();
        this.createTable = this.createTable.bind(this);
    }

    createTable(name){
        let table = []
        // Outer loop to create parent
        for (let i = 0; i < 10; i++) {
            let children = []
            //Inner loop to create children
            for (let j = 0; j < 10; j++) {
                children.push(<td id={`${name}${i*10+j}`}>{`${name}${10*i+j}`}</td>)
            }
            //Create the parent and add the children
            table.push(<tr>{children}</tr>)
        }
        return table
    }

    render(){
        return(
            <div className="container">
                <table id="board">
                    {this.createTable("board")}
                </table>
                <table id="guess">
                    {this.createTable("guess")}
                </table>
            </div>

        )
    }
}
export default Board;