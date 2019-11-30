pragma solidity ^0.4.24;

contract Battleship{
    
    address owner;
    enum SquareState {Empty, X, O}

    struct Game{
        address player1;
        address player2;
        bytes32 [17] board_1;
        bytes32 [17] board_2;
        SquareState[10][10] board_guess_1; // Stores guesses made by player 1
        SquareState[10][10] board_guess_2; // Stores guesses made by player 2
        address turn;
        uint player1_hits;
        uint player2_hits;
        uint timelock;
        uint duration;
        uint threshold;
        uint gameNo;
        address winner;        
    }
    
    constructor() public {
        owner = msg.sender;
        newGame();
    }

    Game public game;

    //Events
    event NewGame(address creator);
    event PlayerJoinedGame(address player);
    event GameStartTime(uint time);
    event GameBoardInitSuccess(address player);
    event PlayerMadeMove(address player, uint8 x, uint8 y);
    event TimedOut(uint cur_time, uint prev_time, uint diff, uint duration);
    event GameWinner(address winner);
    event PlayerMadeAHit(address player, uint8 x, uint8 y, string status);
    event NotValidBoard(uint cell, uint x, uint y);
    event NotEmptyBoard(bool status);

    function newGame() public{
        require(msg.sender == owner, "Only owner can create new Game");
        game.threshold = 4 ether;
        game.duration = 60; //60s for timeout
        game.player1_hits = 0;
        game.player2_hits = 0;
        for(uint8 i=0;i<17;i++){
            game.board_1[i] = bytes32("");
            game.board_2[i] = bytes32("");
        }
        for(i=0; i<10;i++){
            for(uint j=0; j<10; j++){
                game.board_guess_1[i][j] = SquareState.Empty;
                game.board_guess_2[i][j] = SquareState.Empty;
            }
        }
        emit NewGame(msg.sender);
    }

    
    function joinGame() public payable{
        require(msg.sender!=game.player1 && msg.sender!=game.player2, "Already in game");
        require(msg.value>=game.threshold, "Insufficient balance");
        require(game.player1 == address(0) || game.player2 == address(0), "Game in progress");

        if(game.player1==address(0))
            game.player1 = msg.sender;
        else game.player2 = msg.sender;
        
        emit PlayerJoinedGame(msg.sender);
        if(game.turn == address(0))
            game.turn = game.player1;
    }

    function getAddress() public view returns(address,address){
        return (game.player1,game.player2);
    }

    function getTurn() public view returns(address){
        return (game.turn);
    }
    
    function tostring(SquareState state) public pure returns(string memory)
    {
        if(SquareState.X == state){
            return "X";
        }
        if(SquareState.O == state){
            return "O";
        }
        if(SquareState.Empty == state){
            return " ";
        }
    }
    function extract_ships(uint[17] _board) public pure returns(uint[5][5]){
        uint[5][5] memory ships;
        uint i=0; uint k=0;
        while(i < 17){
            uint j = 1;
            while(j+i < 17){
                if(_board[i]+1 == _board[i+j] || _board[j] == _board[i]+10*j)
                    j++;
                else
                    break;
            }
            for(uint l = i; l < j; l++)
                ships[k][l-i] = _board[l];
            i = j;
            k++;
        }
        return ships;
    }

    function isValidBoard(uint[17] _board) public returns(bool){    
        for(uint i=0; i<17; i++){
            uint dir_x = 0; uint dir_y = 0;
            for(uint j=0; j < 17; j++){
                if(_board[i]+1 == _board[j] || _board[i]-1 == _board[j])
                    dir_x++;
                if(_board[i]+10 == _board[j] || _board[i]-10 == _board[j])
                    dir_y++;
                if(dir_x > 0 && dir_y > 0){
                    emit NotValidBoard(_board[i], dir_x, dir_y);
                    return false;
                }
            }
        }
        return true;
    }
    
    function isEmpty(bytes32[17] _board) public returns(bool){
        for(uint8 i=0;i<17;i++){
            if(_board[i]!=bytes32("")){
                emit NotEmptyBoard(true);
                return false;
            }
        }
        emit NotEmptyBoard(false);
        return true;
    }

    function getBoard() public view returns(bytes32[17], bytes32[17]){
        return (game.board_1, game.board_2);
    }

    function intToString(uint v) public pure returns (string) {
        uint maxlength = 100;
        bytes memory reversed = new bytes(maxlength);
        uint i = 0;
        while (v != 0) {
            uint remainder = v % 10;
            v = v / 10;
            reversed[i++] = byte(48 + remainder);
        }
        bytes memory s = new bytes(i + 1);
        for (uint j = 0; j <= i; j++) {
            s[j] = reversed[i - j];
        }
        return string(s);
    }

    function append(string a, string b) public pure returns (string){
        return string(abi.encodePacked(a, b));
    } 

    function initialize_board(uint[17] _board,string _salt) public {
        if(msg.sender==game.player1){
            require(isValidBoard(_board), "Invalid Board(Player 1)");
            require(isEmpty(game.board_1), "Board already initialized(Player 1)");
            for(uint i=0; i<17; i++)
                game.board_1[i] = keccak256(abi.encodePacked(append("X",intToString(_board[i])),_salt));
        }
        else if(msg.sender==game.player2){
            require(isEmpty(game.board_2), "Board already initialized(Player 2)");
            require(isValidBoard(_board), "Invalid Board(Player 2)");
            for(i=0;i<17;i++){
                game.board_2[i] = keccak256(abi.encodePacked(append("X",intToString(_board[i])),_salt));
            }
            game.timelock = now;
            emit GameStartTime(game.timelock);
        }
        emit GameBoardInitSuccess(msg.sender);
    }
    
    function commit_move(uint8 x, uint8 y) public {
        require(x>=0 && x<10 && y>=0 && y<10, "Invalid move");
        require(game.winner == address(0), "Game already has a winner");
        require(game.turn == msg.sender, "Not your turn");
        require(now-game.timelock <= game.duration, "Move TimedOut");

        if(msg.sender==game.player1){
            require(!isEmpty(game.board_2), "Commiting move before player2 initialized board");
            require(game.board_guess_1[x][y] == SquareState.Empty, "Already marked");
            game.board_guess_1[x][y] = SquareState.O;
        }
        else if(msg.sender == game.player2){
            require(!isEmpty(game.board_1), "Commiting move before player1 initialized board");
            require(game.board_guess_2[x][y] == SquareState.Empty, "Already marked");
            game.board_guess_2[x][y] = SquareState.O;
        }

        game.turn = next_turn();
        game.timelock = now; 

        emit PlayerMadeMove(msg.sender, x, y);
    }

    function reveal_move(uint8 x, uint8 y,string _salt) public returns(string){
        require(x>=0 && x<10 && y>=0 && y<10, "Invalid move");
        require(now-game.timelock <= game.duration, "Late in revealing move");
        bool hit = false;
        if(msg.sender==game.player1){
            for(uint i=0; i<17; i++){
                if(game.board_1[i] == keccak256(abi.encodePacked(append("X", intToString(10*x+y)),_salt)) &&
                    game.board_guess_2[x][y] == SquareState.O){
                    game.board_guess_2[x][y] = SquareState.X;
                    game.player2_hits++;
                    hit = true;
                    emit PlayerMadeAHit(msg.sender, x, y, "Hit");
                    break;
            }
         }
            if(!hit)
                emit PlayerMadeAHit(msg.sender, x, y, "Miss");
            check_n_set_winner();
            return tostring(game.board_guess_2[x][y]);
        }
        if(msg.sender==game.player2){
            for(i=0; i<17; i++){
                if(game.board_2[i] == keccak256(abi.encodePacked(append("X", intToString(10*x+y)),_salt)) &&
                    game.board_guess_1[x][y] == SquareState.O){
                    game.board_guess_1[x][y] = SquareState.X;
                    game.player1_hits++;
                    hit = true;
                    emit PlayerMadeAHit(msg.sender, x, y, "Hit");
                    break;
            }
         }
            if(!hit)
                emit PlayerMadeAHit(msg.sender, x, y, "Miss");   
            check_n_set_winner();
            return tostring(game.board_guess_1[x][y]);
        }
    }

    function check_n_set_winner() public{
        if(game.winner == address(0)){
            if(game.player1_hits >= 17){
                game.winner = game.player1;
                game.winner.transfer(address(this).balance);
            }
            else if(game.player2_hits >= 17){
                game.winner = game.player2;
                game.winner.transfer(address(this).balance);
            }
        }
        emit GameWinner(game.winner);
    }
    
    function next_turn() public view returns(address){
        if(game.turn == game.player1)
            return game.player2;
        else
            return game.player1;
    }

    // function to redeem ethers on timeout
    function claimTimeout() public {
        require(now - game.timelock >= game.duration, "Game not yet timed out");
        if(game.turn==game.player1){
            game.winner = game.player2;
            game.player2.transfer(address(this).balance);
        }
        if(game.turn==game.player2){
            game.winner = game.player1;
            game.player1.transfer(address(this).balance);
        }
        emit TimedOut(now, game.timelock, now-game.timelock, game.duration);
    }
}