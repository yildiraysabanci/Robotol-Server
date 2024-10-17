class ClientManager {
    constructor() {
        this.vehicleClients = [];
        this.userClients = [];
        this.connectionManager = null;
    }

    // Register a new vehicle or user client
    registerClient(ws, parsedMessage, clientIP) {
        if (parsedMessage.type === "Vehicle") {
            const vehicleId = parsedMessage.vehicleId;
            if (!vehicleId) return console.log("VehicleId is missing. Cannot classify client.");
            this.vehicleClients.push({ vehicleId, ws });
            console.log(`Vehicle connected: ${clientIP} - VehicleId: ${vehicleId}`);
        } else if (parsedMessage.type === "User") {
            const userId = parsedMessage.userId;
            if (!userId) return console.log("UserId is missing. Cannot classify client.");
            this.userClients.push({ userId, ws });
            console.log(`User connected: ${clientIP} - UserId: ${userId}`);
        } else {
            console.log(`Unknown client type: ${parsedMessage.type}`);
        }
        this.connectionManager.sendClientDataToBrowsers();
    }

    // Prepare client data for browser
    prepareClientData() {
        return {
            vehicles: this.vehicleClients.map(client => client.vehicleId),
            users: this.userClients.map(client => client.userId), 
            connections: this.connectionManager.connectionPairs.map(pair => ({
                userId: pair.userId,
                vehicleId: pair.vehicleId
            }))
        };
    }

    handleClientDisconnection(ws) {
        const disconnectedVehicle = this.vehicleClients.find(client => client.ws === ws);
        const disconnectedUser = this.userClients.find(client => client.ws === ws);
    
        if (disconnectedVehicle) {
            console.log(`Vehicle disconnected: ${disconnectedVehicle.vehicleId}`);
            this.connectionManager.removeConnectionsForVehicle(disconnectedVehicle.vehicleId);
            this.vehicleClients = this.vehicleClients.filter(client => client.ws !== ws);
        } else if (disconnectedUser) {
            console.log(`User disconnected: ${disconnectedUser.userId}`);
            this.connectionManager.removeConnectionsForUser(disconnectedUser.userId);
            this.userClients = this.userClients.filter(client => client.ws !== ws);
        }
    
        this.connectionManager.sendClientDataToBrowsers();
    }
    

   
}

module.exports = ClientManager;
 