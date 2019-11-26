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
    
    constructor() public payable {
        owner = msg.sender;
    }

    mapping(uint256 => Game) public games;
    uint256 public nrOfGames = 0;

    //Events
    event NewGame(uint _gameId, address creator);
    event MoneyRequired(uint money);
    event PlayerJoinedGame(uint _gameId, address player);
    event GameStartTime(uint _gameId, uint time);
    event GameBoardInitSuccess(uint _gameId, address player);
    event PlayerMadeMove(uint _gameId, address player, uint8 x, uint8 y);
    event TimedOut(uint cur_time, uint prev_time, uint diff, uint duration);
    event GameWinner(uint _gameId, address winner);
    event PlayerMadeAHit(uint _gameId, address player, uint8 x, uint8 y);

    function newGame() public{
        require(msg.sender == owner, "Only owner can create new Game");
        Game memory game;
        game.threshold = 20000;
        game.duration = 10; //10s for timeout
        nrOfGames++;
        game.player1_hits = 0;
        game.player2_hits = 0;
        games[nrOfGames] = game;
        emit NewGame(nrOfGames, msg.sender);
    }

    
    function joinGame(uint _gameId) public payable{
        require(_gameId <= nrOfGames, "No such game exists");    
        Game storage game = games[_gameId];
        require(msg.sender!=game.player1 && msg.sender!=game.player2, "Already in game");
        require(msg.value>=game.threshold, "Insufficient balance");
        require(game.player1 == address(0) || game.player2 == address(0), "Game in progress");

        emit MoneyRequired(game.threshold);

        if(game.player1==address(0))
            game.player1 = msg.sender;
        else game.player2 = msg.sender;
        
        emit PlayerJoinedGame(_gameId, msg.sender);
        if(game.turn == address(0))
            game.turn = game.player1;
        if(game.player2 != address(0)){
            game.timelock = now;
            emit GameStartTime(_gameId, game.timelock);
        }
    }

    function getAddress(uint _gameId) public view returns(address,address){
        require(_gameId <= nrOfGames, "No such game exists");    
        Game storage game = games[_gameId];
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
        //require(InBounds(x,y));

    }
    
    function isValidBoard(SquareState[10][10] memory _board) public pure returns(bool){
        
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
    
    function isEmpty(bytes32[10][10] memory _board) public pure returns(bool){
        for(uint8 i=0;i<10;i++){
            for(uint8 j=0;j<10;j++){
                if(_board[i][j]!=bytes32(""))
                    return false;
            }
        }
        return true;
    }

    function initialize_board(uint _gameId, SquareState[10][10] memory _board,string memory _salt) public {
        require(_gameId <= nrOfGames, "No such game exists");    
        Game storage game = games[_gameId];
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
        emit GameBoardInitSuccess(_gameId, msg.sender);
    }
    
    function commit_move(uint _gameId, uint8 x, uint8 y) public {
        require(_gameId <= nrOfGames, "No such game exists");    
        require(x>0 && x<10 && y>0 && y<10, "Invalid move");
        Game storage game = games[_gameId];
        require(game.winner == address(0), "Game already has a winner");
        require(game.turn == msg.sender, "Not your turn");

        if(msg.sender==game.player1)
            game.board_guess_1[x][y] = SquareState.O;
        else if(msg.sender == game.player2)
            game.board_guess_2[x][y] = SquareState.O;

        game.turn = next_turn(_gameId);

        emit PlayerMadeMove(_gameId, msg.sender, x, y);
    }

    function reveal_move(uint _gameId, uint8 x, uint8 y,string memory _salt) public returns(bytes32[10][10], SquareState[10][10]){
        require(_gameId <= nrOfGames, "No such game exists");    
        require(x>0 && x<10 && y>0 && y<10, "Invalid move");

        Game storage game = games[_gameId];
        if(msg.sender==game.player1){
            if(game.board_1[x][y] == keccak256(abi.encodePacked(tostring(game.board_guess_2[x][y]),_salt)) &&
                game.board_guess_2[x][y] == SquareState.O){
                game.board_guess_2[x][y] = SquareState.X;
                game.player2_hits++;
                emit PlayerMadeAHit(_gameId, msg.sender, x, y);
                return (game.board_1, game.board_guess_1);
            }
        }
        if(msg.sender==game.player2){
            if(game.board_2[x][y] == keccak256(abi.encodePacked(tostring(game.board_guess_1[x][y]),_salt))&&
                game.board_guess_1[x][y] == SquareState.O){
                game.board_guess_1[x][y] = SquareState.X;
                game.player1_hits++;
                emit PlayerMadeAHit(_gameId, msg.sender, x, y);
                return (game.board_2, game.board_guess_2);
            }
        }

    }

    function set_winner(uint _gameId) public{
        require(_gameId <= nrOfGames, "No such game exists");
        Game storage game = games[_gameId];
        if(game.winner == address(0)){
            if(game.player1_hits >= 20)
                game.winner = game.player1;
            else if(game.player2_hits >= 20)
                game.winner = game.player2;
        }
        emit GameWinner(_gameId, game.winner);
    }
    
    function next_turn(uint _gameId) public view returns(address){
        require(_gameId <= nrOfGames, "No such game exists");
        Game storage game = games[_gameId];
        if(game.turn == game.player1)
            return game.player2;
        else
            return game.player1;
    }

    // function to redeem ethers on timeout
    function claimTimeout(uint _gameId) public {
        require(_gameId <= nrOfGames, "No such game exists");    
        Game storage game = games[_gameId];
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