pragma solidity ^0.4.24;

contract Battleship{
    
    address owner;
    enum SquareState {Empty, X, O}

    struct Game{
        address player1;
        address player2;
        bytes32 [10][10] board_1;
        bytes32 [10][10] board_2;
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

    function newGame() public{
        require(msg.sender == owner, "Only owner can create new Game");
        game.threshold = 4 ether;
        game.duration = 60; //60s for timeout
        game.player1_hits = 0;
        game.player2_hits = 0;
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
        if(game.player2 != address(0)){
            game.timelock = now;
            emit GameStartTime(game.timelock);
        }
    }

    function getAddress() public view returns(address,address){
        return (game.player1,game.player2);
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
    
    function isValidBoard(SquareState[10][10] _board) public pure returns(bool){
        
        for(uint i=0; i < 10; i++){
            int dir_x=0; int dir_y=0;
            for(uint j=0; j < 10; j++){
                if(_board[i][j] == SquareState.X){
                    if((i+1<10 && _board[i+1][j] == SquareState.X)||
                        (i-1>0 && _board[i-1][j] == SquareState.X))
                        dir_y++;
                    if((j+1<10 && _board[i][j+1] == SquareState.X)||
                        (j-1>0 && _board[i][j-1] == SquareState.X))
                        dir_x++;
                    if(dir_x >0 && dir_y >0)
                        return false;
                }
            }
        }
        return true;
    }
    
    function isEmpty(bytes32[10][10] _board) public pure returns(bool){
        for(uint8 i=0;i<10;i++){
            for(uint8 j=0;j<10;j++){
                if(_board[i][j]!=bytes32(""))
                    return false;
            }
        }
        return true;
    }

    function initialize_board(SquareState[10][10] _board,string _salt) public {
        if(msg.sender==game.player1){
            require(isEmpty(game.board_1), "Board already initialized(Player 1)");
            require(isValidBoard(_board), "Invalid Board(Player 1)");
            for(uint8 i=0;i<10;i++){
                for(uint8 j=0;j<10;j++){
                    game.board_1[i][j] = keccak256(abi.encodePacked(tostring(_board[i][j]),_salt));
                }
            }
            
        }
        else if(msg.sender==game.player2){
            require(isEmpty(game.board_2), "Board already initialized(Player 2)");
            require(isValidBoard(_board), "Invalid Board(Player 2)");
            for(i=0;i<10;i++){
                for(j=0;j<10;j++){
                    game.board_2[i][j] = keccak256(abi.encodePacked(tostring(_board[i][j]),_salt));
                }
            }
        }
        emit GameBoardInitSuccess(msg.sender);
    }
    
    function commit_move(uint8 x, uint8 y) public {
        require(x>0 && x<10 && y>0 && y<10, "Invalid move");
        require(game.winner == address(0), "Game already has a winner");
        require(game.turn == msg.sender, "Not your turn");
        require(now-game.timelock <= game.duration, "Move TimedOut");

        if(msg.sender==game.player1)
            game.board_guess_1[x][y] = SquareState.O;
        else if(msg.sender == game.player2)
            game.board_guess_2[x][y] = SquareState.O;

        game.turn = next_turn();

        emit PlayerMadeMove(msg.sender, x, y);
    }

    function reveal_move(uint8 x, uint8 y,string _salt) public returns(string){
        require(x>0 && x<10 && y>0 && y<10, "Invalid move");
        require(now-game.timelock <= game.duration, "Late in revealing move");

        if(msg.sender==game.player1){
            if(game.board_1[x][y] == keccak256(abi.encodePacked(tostring(game.board_guess_2[x][y]),_salt)) &&
                game.board_guess_2[x][y] == SquareState.O){
                game.board_guess_2[x][y] = SquareState.X;
                game.player2_hits++;
                emit PlayerMadeAHit(msg.sender, x, y, "Hit");
            }
            else 
                emit PlayerMadeAHit(msg.sender, x, y, "Miss");
            return tostring(game.board_guess_2[x][y]);
        }
        if(msg.sender==game.player2){
            if(game.board_2[x][y] == keccak256(abi.encodePacked(tostring(game.board_guess_1[x][y]),_salt))&&
                game.board_guess_1[x][y] == SquareState.O){
                game.board_guess_1[x][y] = SquareState.X;
                game.player1_hits++;
                emit PlayerMadeAHit(msg.sender, x, y, "Hit");
            }
            else 
                emit PlayerMadeAHit(msg.sender, x, y, "Miss");
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