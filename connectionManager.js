const WebSocket = require('ws');

class ConnectionManager {
    constructor(clientManager, browserWSS) {
        this.clientManager = clientManager;
        this.connectionPairs = [];
        this.browserWSS = browserWSS; 
    }

    sendClientListUpdateToAllBrowsers() {
        const clientData = {
            vehicles: this.clientManager.vehicleClients.map(client => client.vehicleId),
            users: this.clientManager.userClients.map(client => client.userId),
            connections: this.connectionPairs 
        };

        
        this.browserWSS.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'clientData',
                    data: clientData
                }));
                console.log('Client data sent:', clientData); 
            }
        });
    }

    removeConnectionsForUser(userId) {
        this.connectionPairs = this.connectionPairs.filter(conn => conn.userId !== userId);
        console.log(`Connections removed for User ${userId}`);
        this.sendClientListUpdateToAllBrowsers();  
    }

    removeConnectionsForVehicle(vehicleId) {
        this.connectionPairs = this.connectionPairs.filter(conn => conn.vehicleId !== vehicleId);
        console.log(`Connections removed for Vehicle ${vehicleId}`);
        this.sendClientListUpdateToAllBrowsers(); 
    }

    // Create connection between a user and a vehicle
    createConnection(userId, vehicleId) {
        const existingConnection = this.connectionPairs.find(conn => conn.userId === userId && conn.vehicleId === vehicleId);
        if (!existingConnection) {
            this.connectionPairs.push({ userId, vehicleId });
            console.log(`Connection created: User ${userId} ↔ Vehicle ${vehicleId}`);
            this.sendClientListUpdateToAllBrowsers();
            
        } else {
            console.log(`Connection already exists: User ${userId} ↔ Vehicle ${vehicleId}`);
        }
    }

    // Disconnect a user from a vehicle
    disconnectConnection(userId, vehicleId) {
        this.connectionPairs = this.connectionPairs.filter(conn => conn.userId !== userId || conn.vehicleId !== vehicleId);
        console.log(`Connection disconnected: User ${userId} ↔ Vehicle ${vehicleId}`);
        this.sendClientListUpdateToAllBrowsers();
        
    }


    // Handle message exchange between user and vehicle
    handleMessageExchange(userId, vehicleId, message, senderWs) {
        const userClient = this.clientManager.userClients.find(client => client.userId === userId);
        const vehicleClient = this.clientManager.vehicleClients.find(client => client.vehicleId === vehicleId);

        if (userClient && vehicleClient) {
            if (senderWs !== userClient.ws && userClient.ws.readyState === WebSocket.OPEN) {
                userClient.ws.send(JSON.stringify({ from: 'Vehicle', vehicleId, message }));
            }

            if (senderWs !== vehicleClient.ws && vehicleClient.ws.readyState === WebSocket.OPEN) {
                vehicleClient.ws.send(JSON.stringify({ from: 'User', userId, message }));
            }
        } else {
            console.log(`Connection not found: User ${userId} ↔ Vehicle ${vehicleId}`);
        }
    }

    sendClientDataToBrowsers() {
        const clientData = this.clientManager.prepareClientData();
        
        this.browserWSS.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'clientData',
                    data: clientData
                }));
            }
        });
    }

    getVehicleIdForUser(userId) {
        const connection = this.connectionPairs.find(conn => conn.userId === userId);
        return connection ? connection.vehicleId : null;
    }
}

module.exports = ConnectionManager;
