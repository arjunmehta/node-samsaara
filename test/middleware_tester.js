/*!
 * Samsaara Middleware Template
 * Copyright(c) 2015 Arjun Mehta <arjun@arjunmehta.net>
 * MIT Licensed
 */


var samsaara;


module.exports = {

    name: 'middleware_unique_name',


    initialize: function(samsaaraExtender, capability, options) {
        samsaara = samsaaraExtender.core;

        samsaaraExtender.addCoreMethods(this.coreMethods);
        samsaaraExtender.addModuleMethods(this.moduleMethods);
        samsaaraExtender.addExposedMethods(this.exposedMethods);
        samsaaraExtender.addConnectionPreInitialization(this.connectionPreInitialization);
        samsaaraExtender.addConnectionInitialization(this.connectionInitialization, {
            forced: true
        });
        samsaaraExtender.addConnectionClose(this.connectionClose);
        samsaaraExtender.addPreRouteFilter(this.preRouteFilter);
        samsaaraExtender.addMessageRoutes(this.messageRoutes);
        samsaaraExtender.addPreRouteFilter(this.preRouteFilter);

        return this;
    },


    // Is this something that should exist?
    // ie. samsaara.executeOnAll('someMethod')('all');

    coreMethods: {
        middlewareTestMethod: function(a) {
            return a * 2;
        },
        middlewareExecuteAll: function() {
            var connection;
            var connectionName;
            for (connectionName in samsaara.connections) {
                connection = samsaara.connections[connectionName];
                connection.execute('testMethod')('value');
            }
        }
    },

    // Adds new methods in the middleware to the module's own namespace.
    // ie. samsaara.groups.group();
    moduleMethods: {
        middlewareModuleMethod: function(a) {
            return a * 3;
        }
    },


    // Adds remotely accessible methods to samsaara's internal namespace. (Should be configurable)
    // ie. samsaara.execute('sendToGroup')
    exposedMethods: {
        middlewareRemoteMethod: function(a, cb) {
            if (cb) cb(a * 5);
        }
    },


    // Adds methods to execute when a new connection is made but not initialized yet.
    connectionPreInitialization: function(connection) {

    },


    // Adds methods to execute to initialize a connection.
    connectionInitialization: function(connectionOptions, connection, done) {
        done();
    },


    // Adds methods to execute when a connection is closed.
    connectionClose: function(connection) {},


    // Adds methods to execute when a new message comes in before it is routed to a method or process (ipc).
    // filter and modify the contents of a message to pass down before the message is routed.
    preRouteFilter: function(connection, headerbits, message, next) {
        next();
    },


    // if the very first chunk of the header matches any one of these it will route the message here.
    // takes the samsaara connection, parsed header bits, and the actual unparsed message
    messageRoutes: {
        RTE: function(connection, headerbits, message) {

        }
    },


    finalize: function() {}
};
