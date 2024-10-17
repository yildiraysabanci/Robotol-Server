class MessageHandler {
    constructor(clientManager, connectionManager) {
        this.clientManager = clientManager;
        this.connectionManager = connectionManager;
    }

    // Handle client messages
    handleClientMessage(ws, parsedMessage, clientIP) {
        switch (parsedMessage.action) {
            case 'sendMessage':
                this.sendMessage(parsedMessage, ws);
                break;
            case 'createConnection':
                this.connectionManager.createConnection(parsedMessage.userId, parsedMessage.vehicleId);
                break;
            case 'disconnectConnection':
                this.connectionManager.disconnectConnection(parsedMessage.userId, parsedMessage.vehicleId);
                break;
            default:
                this.clientManager.registerClient(ws, parsedMessage, clientIP);
                break;
        }
    }

    // Send message between user and vehicle
    sendMessage(parsedMessage, senderWs) {
        const { userId, vehicleId, message: userMessage } = parsedMessage;
        const finalVehicleId = vehicleId || this.connectionManager.getVehicleIdForUser(userId);

        if (!finalVehicleId) {
            return console.log(`No VehicleId found for UserId ${userId}`);
        }

        this.connectionManager.handleMessageExchange(userId, finalVehicleId, userMessage, senderWs);
    }
}

module.exports = MessageHandler;
