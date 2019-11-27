from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask import Flask
import os

app = Flask(__name__)
app.secret_key = os.urandom(67)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///games.db'
db = SQLAlchemy(app)
CORS(app)


class Player(db.Model):

    __tablename__ = 'players'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    address = db.Column(db.String(100), nullable=False)
    game_contract = db.Column(db.String(100), nullable=False) 
    randomseed = db.Column(db.String(64),nullable=False)
