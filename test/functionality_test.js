var BattleShip = artifacts.require("Battleship");

const NEW_GAME_EVENT = "NewGame";
const PLAYER_JOINED_EVENT = "PlayerJoinedGame";
const PLAYER_MADE_MOVE_EVENT = "PlayerMadeMove";
const GAME_START_EVENT = "GameStartTime";
const GAME_BOARD_INIT_EVENT = "GameBoardInitSuccess";
const GAME_WINNER = "GameWinner";
const GAME_TIMED_OUT = "TimedOut";
const GAME_HIT_MOVE_EVENT = "PlayerMadeAHit";

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
