# DApp Battleship

## A distributed app made on Solidity using smart contracts

### Cloning the repo

To clone this repo, use **either** of the given commands

`$ git clone https://github.com/abhigyanghosh30/DApp_Battleship.git`
`$ git clone git@github.com:abhigyanghosh30/DApp_Battleship.git`

### Installation
The app requires 3 things to be installed:
1. React (for frontend)
2. Ganache (to run a test blockchain)
3. Flask and py-solc(backend to deploy contracts and assign opponents automatically)

**The instructions here are valid for Linux systems only**

#### 1. React
To install the frontend and the required modules, go to the folder `./frontend/` and run:
`$ npm install`

#### 2. Ganache
To install Ganache, you can download the AppImage from [this link](https://github.com/trufflesuite/ganache/releases/download/v2.1.2/ganache-2.1.2-linux-x86_64.AppImage)
Or if you have `npm` installed, you can install `Ganache-CLI` by running:
`$ npm install -g ganache-cli`

#### 3. Flask and py-solc

To install the backend and all the required packages, it is recommended to use a python environment wrapper. Inside the wrapper run 
`$ pip install -r requirements.txt`

We are not done yet. We need to install the `py-solc` compiler also before we can get started. The contract used by this app was built on `solc v0.4.24` and is compatible with any solc compiler for `v0.4.x`. To install this, run:
`$ python -m solc.install v0.4.25`
`$ export SOLC_BINARY="$HOME/.py-solc/solc-v0.4.25/bin/solc"`

### Testing 
The code is configured for localhost testing out of the box. To deploy it on public servers, you just need to change the server IP addresses.

#### 1. Start Ganache
To run Ganache, simply go to the folder where you have the Ganache AppImage downloaded and run:
`$ ./ganache-<version>-linux-x86_64.AppImage`
or run
`$ ganache-cli --port=8545`

#### 2. Start Flask Server 
To start the python server run
``` 
$ cd webapp
$ python main.py
```
#### 3. Start React Server
To start the React server run
```
$ cd frontend
$ npm run start
```
By default, the app will start at port 3000. Your default browser should open a new tab on `http://localhost:3000` after React finishes compiling. 

### Deployment
#### 1. Deploying Flask
To deploy Flask on a public server, you can follow [these tutorials](https://flask.palletsprojects.com/en/1.1.x/deploying/)
Before deploying, configure the IP addresses to the IP of the corresponding Ethereum networks. 

#### 2. Deploy React
To deploy React on a public server, you can follow [this tutorial](https://create-react-app.dev/docs/deployment/)
Before deploying, configure the IP addresses to the IP of the corresponding Ethereum networks. Also change the IP address of the Flask App aptly.






