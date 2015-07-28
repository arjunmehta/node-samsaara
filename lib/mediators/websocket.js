// Websocket Client Mediator

function MediatedWebsocketClient(socket, samsaaraConnection, messageHandler) {
    var self = this;

    this.realSocket = socket;
    this.connection = samsaaraConnection;
    this.queue = [];

    socket.on('open', function() {
        self.open = true;
        self.sendQueue();
    });

    socket.on('message', function(event) {
        samsaaraConnection.incomingPulse.beat();
        messageHandler(samsaaraConnection, event.data);
    });

    socket.on('close', function(event) {
        self.open = false;
    });
}

MediatedWebsocketClient.prototype.send = function(message) {
    if (this.open === true) {
        this.connection.outgoingPulse.beat();
        this.realSocket.send(message);
    } else {
        this.queueMessage(message);
    }
};

MediatedWebsocketClient.prototype.sendQueue = function(message) {
    var i;
    for (i = 0; i < this.queue.length; i++) {
        this.send(this.queue[i]);
    }
    this.queue = [];
};

MediatedWebsocketClient.prototype.queueMessage = function(message) {
    this.queue.push(message);
};


// Websocket Server Mediator

function MediatedWebsocketServer(socket, samsaaraConnection, messageHandler) {
    var self = this;

    this.realSocket = socket;
    this.connection = samsaaraConnection;
    this.queue = [];

    socket.on('message', function(event) {
        samsaaraConnection.incomingPulse.beat();
        messageHandler(samsaaraConnection, event.data);
    });

    socket.on('close', function(event) {
        self.open = false;
    });
}

MediatedWebsocketServer.prototype.send = function(message) {
    this.connection.outgoingPulse.beat();
    this.realSocket.send(message);
};


module.exports = {
    Client: MediatedWebsocketClient,
    Server: MediatedWebsocketServer
};