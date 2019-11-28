import json
from flask import Flask, Response, request, json
from web3 import Web3
from solc import compile_files, link_code, compile_source
from models import db,app,Player
import random

w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))

def deploy_contract(contract_interface):
    contract = w3.eth.contract(
        abi=contract_interface['abi'],
        bytecode=contract_interface['bin']
    )
    tx_hash =contract.constructor().transact(transaction={'from':w3.eth.accounts[0]})
    tx_receipt = w3.eth.getTransactionReceipt(tx_hash)
    return tx_receipt['contractAddress']

contracts = compile_files(['../contracts/Battleship.sol'])
for i in contracts:
    print(i)
game_contract = contracts.pop("../contracts/Battleship.sol:Battleship")
# deployment_address = {
#     "Battleship.sol:Battleship": deploy_contract(game_contract)
# }

# game_contract['bin'] = link_code(game_contract['bin'],deployment_address)

# with open('data.json', 'w') as outfile:
#     data = {
#         "abi": game_contract['abi'],
#         "contract_address": deploy_contract(game_contract)
#     }
#     json.dump(data, outfile, indent=4, sort_keys=True)


###########################
# ROUTES
###########################

@app.before_first_request
def initialize():
    db.create_all()

@app.route("/btlshp/<address>")
def add_to_database(address):
    players = Player.query.all()
    if(len(players)%2==1):
        last=Player.query.order_by(Player.id.desc()).first()
        gc = last.game_contract
    else:
        gc = deploy_contract(game_contract)
    randomseed = hex(random.randint(1,2**128))[2:]
    player = Player(address=address,game_contract=gc,randomseed=randomseed)
    db.session.add(player)
    db.session.commit()
    return Response(json.dumps({'address':gc,'abi':game_contract['abi'],'salt':randomseed}), status = 200, mimetype = 'application/json')

if __name__ == "__main__":
    app.run(port=8000,debug=True,host="127.0.0.1")