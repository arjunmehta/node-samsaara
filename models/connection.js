/*!
 * samsaaraSocks - Connection Constructor
 * Copyright(c) 2013 Arjun Mehta <arjun@newlief.com>
 * MIT Licensed
 */

// var memwatch = require('memwatch');

var debug = require('debug')('samsaara:connection:main');
var debugInitialization = require('debug')('samsaara:connection:initialization');
var debugCommunication = require('debug')('samsaara:connection:communication');

var samsaara = require('../index.js');
var config = require('../lib/config');

var communication = require('../lib/communication');
var connectionController = require('../lib/connectionController');
var router = require('../lib/router');

var connections = connectionController.connections;

exports = module.exports = Connection;


function Connection(conn){

  var connection = this;

  this.id = conn.id;
  this.conn = conn;

  this.owner = config.uuid;

  this.initializeAttributes = new InitializedAttributes(this);
  this.initialized = false;

  this.lastHeartBeat = 0;

  this.connectionData = {};

  for(var i=0; i < this.preInitializationMethods.length; i++){
    this.preInitializationMethods[i](connection);
  }

  conn.on('close', function (message){
    connection.closeConnection(message);
  });

  conn.on('data', function (message){
    connection.handleMessage(message);
  });

  conn.write(JSON.stringify(["init",{
    samsaaraID: connection.id,
    samsaaraOwner: config.uuid,
    samsaaraHeartBeat: connectionController.heartBeatThreshold
  }]));

  samsaara.emit("connect", this);
}


Connection.prototype.preInitializationMethods = [];

Connection.prototype.initializationMethods = [];

Connection.prototype.closingMethods = [];


/*
 * Method to update connectionData attribute on the connection. This method should be used when updating
 * the connection with new data, as it can be middlewared to broadcast changes, etc.
 */

Connection.prototype.updateDataAttribute = function(attributeName, value) {
  this.connectionData[attributeName] = value;
};


/*
 * Method to handle new socket messages.
 */

Connection.prototype.handleMessage = function(raw_message){

  // this.score = ((connectionController.globalBeat - this.lastHeartBeat) > 0 ? 20000 : 0 ) + (this.score > 20000 ? 20000 : this.score) - (raw_message.length);
  // console.log(this.score, connectionController.globalBeat, this.lastHeartBeat);

  this.lastHeartBeat = connectionController.globalBeat;

  switch(raw_message){
    case "H":
      debugCommunication("Heartbeat...", this.id, this.lastHeartBeat, connectionController.globalBeat);
      break;
    default:
      router.newConnectionMessage(this, raw_message);
  }
};


/*
 * Method to handle new socket messages.
 */

Connection.prototype.write = function(message){
  // debugCommunication(config.uuid, "NATIVE write on", this.id);
  this.conn.write(message);
};


/*
 * Connection close handler.
 */

Connection.prototype.closeConnection = function(message){
  // var hd = new memwatch.HeapDiff();
  ////////

  var connID = this.id;
  samsaara.emit("disconnect", this);

  for(var i=0; i < this.closingMethods.length; i++){
    this.closingMethods[i](this);
  }

  this.conn.removeAllListeners();

  delete connections[connID];

  // debug(config.uuid, "CLOSING:", connID, message);

  ////////
  // var diff = hd.end();
  // console.log(diff.change.details);
};


/*
 * Method to start the initialization process. Executed from the router, when the opts message is received.
 */

Connection.prototype.initialize = function(opts){

  debugInitialization("Trying To Initialize Connection...", this.id);

  opts = opts || {};

  var connection = this;
  var ia = this.initializeAttributes;

  for(var i=0; i < this.initializationMethods.length; i++){
    this.initializationMethods[i](opts, connection, ia);
  }

  ia.ready = true;

};


/*
 * Method to finish the initialization process.
 */

Connection.prototype.completeInitialization = function(){
  if(this.initialized === false){
    this.initialized = true;

    debugInitialization(config.uuid, this.id, "Initialized");

    communication.sendToClient(this.id, {internal: "samsaaraInitialized", args: [true]}, function (confirmation){
      samsaara.emit('initialized', this.connection);
    });
  }
};


/*
 * A special object that manages the initialization of various attributes of the connection.
 */

function InitializedAttributes(connection){
  this.connection = connection;
  this.forced = {};
  this.count = 0;
  this.ready = false;
}

InitializedAttributes.prototype.force = function(attribute){
  this.forced[attribute] = false;
};

InitializedAttributes.prototype.initialized = function(err, attribute){

  debugInitialization("...Initialized attribute", attribute, this.forced);

  if(err) debugInitialization(err);

  if(this.forced[attribute] !== undefined){
    this.forced[attribute] = true;

    if(this.allInitialized() === true){
      this.connection.completeInitialization();
    }
  }
};

InitializedAttributes.prototype.allInitialized = function(){
  var forced = this.forced;
  if(this.ready){
    for(var attr in forced){
      if (forced[attr] === false) return false;
    }
  }
  return true;
};

