pragma solidity >=0.4.24 <0.6.0;

contract Battleship{
    
    address payable owner;
    enum SquareState {Empty, X, O}

    struct Game{
        bytes32 [10][10] board_1;
        address payable player1;
        address payable player2;
        bytes32 [10][10] board_2;
        SquareState[10][10] board_guess_1; // Stores guesses made by player 1
        SquareState[10][10] board_guess_2; // Stores guesses made by player 2
        address turn;
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

    function newGame() public{
        require(msg.sender == owner, "Only owner can create new Game");
        Game memory game;
        game.threshold = 20000;
        game.duration = 10;
        nrOfGames++;
        games[nrOfGames] = game;
    }

    function isEmpty(bytes32[10][10] memory _board) public pure returns(bool){
        for(uint8 i=0;i<10;i++){
            for(uint8 j=0;j<10;j++){
                if(_board[i][j]!=bytes32(""))
                {
                    return false;
                }
            }
        }
        return true;
    }
    
    function joinGame(uint _gameId) public payable{
        require(_gameId <= nrOfGames, "No such game exists");    
        Game storage game = games[_gameId];
        require(msg.sender!=game.player1 && msg.sender!=game.player2, "Already in game");
        require(msg.value>=game.threshold, "Insufficient balance");
        require(game.player1 == address(0) || game.player2 == address(0), "Game in progress");
        if(game.player1==address(0))
            game.player1 = msg.sender;
        else game.player2 = msg.sender;
        if(game.turn == address(0))
            game.turn = game.player1;
        if(game.player2 != address(0))
            game.timelock = now;
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
    
    function initialize_board(uint _gameId, SquareState[10][10] memory _board,string memory _salt) public view {
        require(_gameId <= nrOfGames, "No such game exists");    
        Game storage game = games[_gameId];
        if(msg.sender==game.player1){
            require(isEmpty(game.board_1), "Invalid Board(Player 1)");
            for(uint8 i=0;i<10;i++){
                for(uint8 j=0;j<10;j++){
                    keccak256(abi.encodePacked(tostring(_board[i][j]),_salt));
                }
            }
            
        }
        if(msg.sender==game.player2){
            require(isEmpty(game.board_2), "Invalid Board(Player 2)");
        }
    }
    
    
    
    function commit_move(uint _gameId, uint8 x, uint8 y) public {
        require(x>0 && x<10 && y>0 && y<10, "Invalid move");
        require(_gameId <= nrOfGames, "No such game exists");    
        Game storage game = games[_gameId];
        if(msg.sender==game.player1){
            game.board_guess_1[x][y] = SquareState.O;  
        }
    }
    
    function reveal_move(uint _gameId, uint8 x, uint8 y,string memory _salt) public view returns(bool){
        require(_gameId <= nrOfGames, "No such game exists");    
        Game storage game = games[_gameId];
        if(msg.sender==game.player1){
            return game.board_1[x][y] == keccak256(abi.encodePacked(tostring(game.board_guess_2[x][y]),_salt));
        }
        if(msg.sender==game.player2){
            return game.board_2[x][y] == keccak256(abi.encodePacked(tostring(game.board_guess_1[x][y]),_salt));
        }
    }
    
    // function to redeem ethers on timeout
    function claimTimeout(uint _gameId) public {
        require(_gameId <= nrOfGames, "No such game exists");    
        Game storage game = games[_gameId];
        require(now - game.timelock >= game.duration, "Game not yet timed out");
        if(game.turn==game.player1){
            game.player2.transfer(address(this).balance);
        }
        if(game.turn==game.player2){
            game.player1.transfer(address(this).balance);
        }
    }
}