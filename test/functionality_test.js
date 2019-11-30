var BattleShip = artifacts.require("Battleship");

const NEW_GAME_EVENT = "NewGame";
const PLAYER_JOINED_EVENT = "PlayerJoinedGame";
const PLAYER_MADE_MOVE_EVENT = "PlayerMadeMove";
const PLAYER_HIT_MOVE_EVENT = "PlayerMadeAHit";
const GAME_START_EVENT = "GameStartTime";
const GAME_BOARD_INIT_EVENT = "GameBoardInitSuccess";
const GAME_WINNER = "GameWinner";
const GAME_TIMED_OUT = "TimedOut";

function wait(time){
   var start = new Date().getTime();
   var end = start;
   while(end < start + time) {
     end = new Date().getTime();
  }
}

contract('Battleship', function(accounts) {
	it("should create a game", async() => {
		var battleship;
		return await BattleShip.new().then(async(instance) => {
			battleship = instance;
			return await battleship.newGame({from:accounts[0]});
		}).then(async(result) => {
			eventArgs = await getEventArgs(result, NEW_GAME_EVENT);
			assert.isTrue(eventArgs !== false);
			assert.equal(accounts[0], eventArgs.creator, "Game not created by owner");
		});
	});

	it("should join a game with sufficient funds", async() => {
		var battleship = await BattleShip.new();
		await battleship.newGame({from:accounts[0]});
		let result = await battleship.joinGame({from:accounts[1], value:web3.utils.toWei('4', 'ether')});

		eventArgs = getEventArgs(result, PLAYER_JOINED_EVENT);
		assert.isTrue(eventArgs !== false, "Player joined game with insufficient funds");
		let game = await battleship.game.call();
		let address = game.player1;
		assert.equal(address, accounts[1], "Invaild joining"); 
	});

	it("should not join a game with insufficient funds", async() => {
		var battleship = await BattleShip.new();
		await battleship.newGame({from:accounts[0]});
		try{
			await battleship.joinGame({from:accounts[1], value:web3.utils.toWei('3', 'ether')});
		}
		catch(error){
			assert.include(error.message, "revert");
		}
	});

	it("Existing player should not join again", async() => {
		var battleship = await BattleShip.new();
		await battleship.newGame({from:accounts[0]});
		await battleship.joinGame({from:accounts[1], value:web3.utils.toWei('4', 'ether')});
		await battleship.joinGame({from:accounts[2], value:web3.utils.toWei('4', 'ether')});

		try{
			await battleship.joinGame({from:accounts[1], value:web3.utils.toWei('4', 'ether')});
		}
		catch(error){
			assert.include(error.message, "Already in game");
		}
		try{
			await battleship.joinGame({from:accounts[2], value:web3.utils.toWei('4', 'ether')});
		}
		catch(error){
			assert.include(error.message, "Already in game");
		}

	});

	it("should not accept more than 2 players", async() => {
		var battleship = await BattleShip.new();
		await battleship.newGame({from:accounts[0]});
		let result = await battleship.joinGame({from:accounts[1], value:web3.utils.toWei('4', 'ether')});
		eventArgs = getEventArgs(result, PLAYER_JOINED_EVENT);
		assert.isTrue(eventArgs !== false, "Player one didn't join game");

		result = await battleship.joinGame({from:accounts[2], value:web3.utils.toWei('4', 'ether')});
		eventArgs = getEventArgs(result, PLAYER_JOINED_EVENT);
		assert.isTrue(eventArgs !== false, "Player two didn't join game");
		try{
			await battleship.joinGame({from:accounts[3], value:web3.utils.toWei('4', 'ether')});
		}
		catch(error){
			assert.include(error.message, "Game in progress");
		}
	});

	it("should be a valid board", async() => {
		var battleship = await BattleShip.new();
		var board = [12,13,14,7,8,32,33,34,76,77,78,79,50,51,52,53,54];
		let result = await battleship.isValidBoard(board, {from:accounts[0]})
		assert.isTrue(result !== false, "Not a valid board");
	});

	it("should not be a valid board", async() => {
		var battleship = await BattleShip.new();
		var board = [12,13,14,7,8,22,23,24,76,77,78,79,50,51,52,53,54];
		let result = await battleship.isValidBoard(board, {from:accounts[0]})
		assert.isTrue(result !== true, "Is a valid board");
	});

	it("game board should be empty", async() => {
		var battleship = await BattleShip.new();
		await battleship.newGame({from:accounts[0]});
		let board = await battleship.getBoard({from:accounts[0]});
		let result = await battleship.isEmpty(board[0], {from:accounts[0]});
		assert.isTrue(result !== false, "Board is not empty");
	});

	it("should initialize a valid board for both players", async() => {
		var battleship = await BattleShip.new();
		var salt1 = "dd7d33879073248f2a29f4c5dfe30dff35480dd389e36359e3dd4a501a8c9812";
		var salt2 = "293485a756665aaf25c949f2d372c5c51b83ea77b642660a62b8882a758934ec";

		await battleship.newGame({from:accounts[0]});

		let result = await battleship.joinGame({from:accounts[1], value:web3.utils.toWei('4', 'ether')});
		eventArgs = getEventArgs(result, PLAYER_JOINED_EVENT);
		assert.isTrue(eventArgs !== false, "Player one didn't join game");

		result = await battleship.joinGame({from:accounts[2], value:web3.utils.toWei('4', 'ether')});
		eventArgs = getEventArgs(result, PLAYER_JOINED_EVENT);
		assert.isTrue(eventArgs !== false, "Player two didn't join game");

		var board1 = [12,13,14,7,8,32,33,34,76,77,78,79,50,51,52,53,54];
		result = await battleship.initialize_board(board1, salt1, {from:accounts[1]})
		eventArgs = getEventArgs(result, GAME_BOARD_INIT_EVENT);
		assert.equal(eventArgs.player, accounts[1], "Board not initialized for player 1");
		
		var board2 = [21,22,51,52,53,71,72,73,5,6,7,8,94,95,96,97,98];
		result = await battleship.initialize_board(board2, salt2, {from:accounts[2]})
		eventArgs = getEventArgs(result, GAME_BOARD_INIT_EVENT);
		assert.equal(eventArgs.player, accounts[2], "Board not initialized for player 2");

	});

	it("player should be able to commit move", async() => {
		
		var battleship = await BattleShip.new();
		var salt1 = "dd7d33879073248f2a29f4c5dfe30dff35480dd389e36359e3dd4a501a8c9812";
		var salt2 = "293485a756665aaf25c949f2d372c5c51b83ea77b642660a62b8882a758934ec";

		await battleship.newGame({from:accounts[0]});
		let result = await battleship.joinGame({from:accounts[1], value:web3.utils.toWei('4', 'ether')});
		eventArgs = getEventArgs(result, PLAYER_JOINED_EVENT);
		assert.isTrue(eventArgs !== false, "Player one didn't join game");

		result = await battleship.joinGame({from:accounts[2], value:web3.utils.toWei('4', 'ether')});
		eventArgs = getEventArgs(result, PLAYER_JOINED_EVENT);
		assert.isTrue(eventArgs !== false, "Player two didn't join game");

		var board1 = [12,13,14,7,8,32,33,34,76,77,78,79,50,51,52,53,54];
		result = await battleship.initialize_board(board1, salt1, {from:accounts[1]})
		eventArgs = getEventArgs(result, GAME_BOARD_INIT_EVENT);
		assert.equal(eventArgs.player, accounts[1], "Board not initialized for player 1");
		
		var board2 = [21,22,51,52,53,71,72,73,5,6,7,8,94,95,96,97,98];
		result = await battleship.initialize_board(board2, salt2, {from:accounts[2]})
		eventArgs = getEventArgs(result, GAME_BOARD_INIT_EVENT);
		assert.equal(eventArgs.player, accounts[2], "Board not initialized for player 2");

		result = await battleship.commit_move(1,2, {from:accounts[1]});
		eventArgs = getEventArgs(result, PLAYER_MADE_MOVE_EVENT);
		assert.equal(eventArgs.player, accounts[1], "Board not initialized for player 2");

	});

	it("player shouldn't be able to commit_move", async() => {
		var battleship = await BattleShip.new();
		var salt1 = "dd7d33879073248f2a29f4c5dfe30dff35480dd389e36359e3dd4a501a8c9812";
		var salt2 = "293485a756665aaf25c949f2d372c5c51b83ea77b642660a62b8882a758934ec";

		await battleship.newGame({from:accounts[0]});
		await battleship.joinGame({from:accounts[1], value:web3.utils.toWei('4', 'ether')});
		await battleship.joinGame({from:accounts[2], value:web3.utils.toWei('4', 'ether')});

		var board1 = [12,13,14,7,8,32,33,34,76,77,78,79,50,51,52,53,54];
		await battleship.initialize_board(board1, salt1, {from:accounts[1]})
		
		var board2 = [21,22,51,52,53,71,72,73,5,6,7,8,94,95,96,97,98];
		await battleship.initialize_board(board2, salt2, {from:accounts[2]})

		try{
			await battleship.commit_move(1,2, {from:accounts[2]});
		}
		catch(error){
			assert.include(error.message, "Not your turn");
		}

		try{
			await battleship.commit_move(11,2, {from:accounts[1]});
		}
		catch(error){
			assert.include(error.message, "Invalid move");
		}
		try{
			wait(60000);
			await battleship.commit_move(1,2, {from:accounts[1]});
		}
		catch(error){
			assert.include(error.message, "Move TimedOut");
		}
	});
	
	it("player shouldn't able to mark the same cell twice", async() => {
		var battleship = await BattleShip.new();
		var salt1 = "dd7d33879073248f2a29f4c5dfe30dff35480dd389e36359e3dd4a501a8c9812";
		var salt2 = "293485a756665aaf25c949f2d372c5c51b83ea77b642660a62b8882a758934ec";

		await battleship.newGame({from:accounts[0]});
		await battleship.joinGame({from:accounts[1], value:web3.utils.toWei('4', 'ether')});

		await battleship.joinGame({from:accounts[2], value:web3.utils.toWei('4', 'ether')});

		var board1 = [12,13,14,7,8,32,33,34,76,77,78,79,50,51,52,53,54];
		await battleship.initialize_board(board1, salt1, {from:accounts[1]})
		
		var board2 = [21,22,51,52,53,71,72,73,5,6,7,8,94,95,96,97,98];
		await battleship.initialize_board(board2, salt2, {from:accounts[2]})

		await battleship.commit_move(2,1, {from:accounts[1]});
		await battleship.commit_move(2,1, {from:accounts[2]});
		try{
			await battleship.commit_move(2,1, {from:accounts[1]});
		}
		catch(error){
			assert.include(error.message, "Already marked");
		}

	});

	it("player2 should reveal move with a hit", async() => {
		
		var battleship = await BattleShip.new();
		var salt1 = "dd7d33879073248f2a29f4c5dfe30dff35480dd389e36359e3dd4a501a8c9812";
		var salt2 = "293485a756665aaf25c949f2d372c5c51b83ea77b642660a62b8882a758934ec";

		await battleship.newGame({from:accounts[0]});
		await battleship.joinGame({from:accounts[1], value:web3.utils.toWei('4', 'ether')});

		await battleship.joinGame({from:accounts[2], value:web3.utils.toWei('4', 'ether')});

		var board1 = [12,13,14,7,8,32,33,34,76,77,78,79,50,51,52,53,54];
		await battleship.initialize_board(board1, salt1, {from:accounts[1]})
		
		var board2 = [21,22,51,52,53,71,72,73,5,6,7,8,94,95,96,97,98];
		await battleship.initialize_board(board2, salt2, {from:accounts[2]})

		await battleship.commit_move(2,1, {from:accounts[1]});

		result = await battleship.reveal_move(2,1, salt2, {from:accounts[2]});
		eventArgs = getEventArgs(result, PLAYER_HIT_MOVE_EVENT);
		assert.equal(eventArgs.status, "Hit", "Player1 didn't hit");
	});

	it("player2 should reveal move with a miss", async() => {
		
		var battleship = await BattleShip.new();
		var salt1 = "dd7d33879073248f2a29f4c5dfe30dff35480dd389e36359e3dd4a501a8c9812";
		var salt2 = "293485a756665aaf25c949f2d372c5c51b83ea77b642660a62b8882a758934ec";

		await battleship.newGame({from:accounts[0]});
		await battleship.joinGame({from:accounts[1], value:web3.utils.toWei('4', 'ether')});

		await battleship.joinGame({from:accounts[2], value:web3.utils.toWei('4', 'ether')});

		var board1 = [12,13,14,7,8,32,33,34,76,77,78,79,50,51,52,53,54];
		await battleship.initialize_board(board1, salt1, {from:accounts[1]})
		
		var board2 = [21,22,51,52,53,71,72,73,5,6,7,8,94,95,96,97,98];
		await battleship.initialize_board(board2, salt2, {from:accounts[2]})

		await battleship.commit_move(2,3, {from:accounts[1]});

		result = await battleship.reveal_move(2,3, salt2, {from:accounts[2]});
		eventArgs = getEventArgs(result, PLAYER_HIT_MOVE_EVENT);
		assert.equal(eventArgs.status, "Miss", "Player1 got a hit");
	});

	it("player2 should be late in revealing move", async() => {
		
		var battleship = await BattleShip.new();
		var salt1 = "dd7d33879073248f2a29f4c5dfe30dff35480dd389e36359e3dd4a501a8c9812";
		var salt2 = "293485a756665aaf25c949f2d372c5c51b83ea77b642660a62b8882a758934ec";

		await battleship.newGame({from:accounts[0]});
		await battleship.joinGame({from:accounts[1], value:web3.utils.toWei('4', 'ether')});

		await battleship.joinGame({from:accounts[2], value:web3.utils.toWei('4', 'ether')});

		var board1 = [12,13,14,7,8,32,33,34,76,77,78,79,50,51,52,53,54];
		await battleship.initialize_board(board1, salt1, {from:accounts[1]})
		
		var board2 = [21,22,51,52,53,71,72,73,5,6,7,8,94,95,96,97,98];
		await battleship.initialize_board(board2, salt2, {from:accounts[2]})

		await battleship.commit_move(2,1, {from:accounts[1]});
		wait(60000);
		try{
			await battleship.reveal_move(2,1, salt2, {from:accounts[2]});
		}
		catch(error){
			assert.include(error.message, "Late in revealing move");
		}
	});

	it("Should check for winner", async() => {
		var battleship = await BattleShip.new();
		var salt1 = "dd7d33879073248f2a29f4c5dfe30dff35480dd389e36359e3dd4a501a8c9812";
		var salt2 = "293485a756665aaf25c949f2d372c5c51b83ea77b642660a62b8882a758934ec";

		await battleship.newGame({from:accounts[0]});
		await battleship.joinGame({from:accounts[1], value:web3.utils.toWei('4', 'ether')});
		await battleship.joinGame({from:accounts[2], value:web3.utils.toWei('4', 'ether')});

		var board1 = [12,13,14,7,8,32,33,34,76,77,78,79,50,51,52,53,54];
		await battleship.initialize_board(board1, salt1, {from:accounts[1]})
		
		var board2 = [21,22,51,52,53,71,72,73,5,6,7,8,94,95,96,97,98];
		await battleship.initialize_board(board2, salt2, {from:accounts[2]})

		result = await battleship.check_n_set_winner();
		eventArgs = getEventArgs(result, GAME_WINNER);
		assert.equal(eventArgs.winner, "0x0000000000000000000000000000000000000000", "Game has a winner");
	});

	it("should be able to redeem ethers after timeout", async() => {
		var battleship = await BattleShip.new();
		var salt1 = "dd7d33879073248f2a29f4c5dfe30dff35480dd389e36359e3dd4a501a8c9812";
		var salt2 = "293485a756665aaf25c949f2d372c5c51b83ea77b642660a62b8882a758934ec";

		await battleship.newGame({from:accounts[0]});
		await battleship.joinGame({from:accounts[1], value:web3.utils.toWei('4', 'ether')});
		await battleship.joinGame({from:accounts[2], value:web3.utils.toWei('4', 'ether')});

		var board1 = [12,13,14,7,8,32,33,34,76,77,78,79,50,51,52,53,54];
		await battleship.initialize_board(board1, salt1, {from:accounts[1]})
		
		var board2 = [21,22,51,52,53,71,72,73,5,6,7,8,94,95,96,97,98];
		await battleship.initialize_board(board2, salt2, {from:accounts[2]})

		let prev_balance = await web3.eth.getBalance(accounts[2]);
		let prev_value = web3.utils.fromWei(prev_balance, 'ether');
		wait(60000);
		await battleship.claimTimeout();
		let cur_balance = await web3.eth.getBalance(accounts[2]);
		let cur_value = web3.utils.fromWei(cur_balance, 'ether');
		assert.isTrue(cur_value-prev_value >= 7.5, "Ethers not transferred");
	});
	it("shouldn't be able to redeem ethers before timeout", async() => {
		var battleship = await BattleShip.new();
		var salt1 = "dd7d33879073248f2a29f4c5dfe30dff35480dd389e36359e3dd4a501a8c9812";
		var salt2 = "293485a756665aaf25c949f2d372c5c51b83ea77b642660a62b8882a758934ec";

		await battleship.newGame({from:accounts[0]});
		await battleship.joinGame({from:accounts[1], value:web3.utils.toWei('4', 'ether')});
		await battleship.joinGame({from:accounts[2], value:web3.utils.toWei('4', 'ether')});

		var board1 = [12,13,14,7,8,32,33,34,76,77,78,79,50,51,52,53,54];
		await battleship.initialize_board(board1, salt1, {from:accounts[1]})
		
		var board2 = [21,22,51,52,53,71,72,73,5,6,7,8,94,95,96,97,98];
		await battleship.initialize_board(board2, salt2, {from:accounts[2]})

		try{
			await battleship.claimTimeout();
		}
		catch(error){
			assert.include(error.message, "Game not yet timed out");
		}
	});

	it("should declare player1 as winner", async() => {
		var battleship = await BattleShip.new();
		var salt1 = "dd7d33879073248f2a29f4c5dfe30dff35480dd389e36359e3dd4a501a8c9812";
		var salt2 = "293485a756665aaf25c949f2d372c5c51b83ea77b642660a62b8882a758934ec";

		await battleship.newGame({from:accounts[0]});
		await battleship.joinGame({from:accounts[1], value:web3.utils.toWei('4', 'ether')});
		await battleship.joinGame({from:accounts[2], value:web3.utils.toWei('4', 'ether')});

		var board1 = [12,13,14,7,8,32,33,34,76,77,78,79,50,51,52,53,54];
		await battleship.initialize_board(board1, salt1, {from:accounts[1]})
		
		var board2 = [21,22,51,52,53,71,72,73,5,6,7,8,94,95,96,97,98];
		await battleship.initialize_board(board2, salt2, {from:accounts[2]})

		var moves1 = []
		var moves2 = []
		for(i=0; i<17; i++){
			moves1.push([Math.floor(board2[i]/10), board2[i]%10])
			moves2.push([Math.floor(board1[i]/10), board1[i]%10])
		}

		for(i=0;i<16;i++){
			await battleship.commit_move(moves1[i][0],moves1[i][1], {from:accounts[1]});
			await battleship.reveal_move(moves1[i][0],moves1[i][1], salt2, {from:accounts[2]});
			await battleship.commit_move(moves2[i][0],moves2[i][1], {from:accounts[2]});
			await battleship.reveal_move(moves2[i][0],moves2[i][1], salt1, {from:accounts[1]});
		}
		await battleship.commit_move(moves1[16][0],moves1[16][1], {from:accounts[1]});
		result = await battleship.reveal_move(moves1[16][0],moves1[16][1], salt2, {from:accounts[2]});
		eventArgs = getEventArgs(result, GAME_WINNER);
		assert.equal(eventArgs.winner, accounts[1], "Wrong winner");
	});

});

function getEventArgs(transaction_result, event_name) {
	for (var i = 0; i < transaction_result.logs.length; i++) {
        var log = transaction_result.logs[i];

        if (log.event == event_name) {
            return log.args;
        }
    }

    return false;
}
