const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Import managers
const ClientManager = require('./clientManager');
const ConnectionManager = require('./connectionManager');
const MessageHandler = require('./messageHandler');

// Server class to manage both HTTP and WebSocket servers
class WebSocketServerManager {
    constructor(browserPort, vehicleUserPort) {
        this.clientManager = new ClientManager();
        this.connectionManager = new ConnectionManager(this.clientManager, this.browserWSS);
        this.clientManager.connectionManager = this.connectionManager; 
        this.messageHandler = new MessageHandler(this.clientManager, this.connectionManager);

        this.initHTTPServer(browserPort);  // Initialize HTTP server
        this.initWebSocketServers(vehicleUserPort);  // Initialize WebSocket server for vehicles and users
    }

    // Initialize HTTP server for the browser
    initHTTPServer(browserPort) {
        this.server = http.createServer((req, res) => {
            if (req.url === '/') {
                fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
                    if (err) {
                        res.writeHead(500);
                        return res.end('Error loading HTML page');
                    }
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(data);
                });
            }
        });

        // Create WebSocket for browser
        this.browserWSS = new WebSocket.Server({ server: this.server });
        this.connectionManager.browserWSS = this.browserWSS;        

        this.browserWSS.on('connection', (ws) => {
            console.log('Browser connected');      
      
            const clientData = {
                vehicles: this.clientManager.vehicleClients.map(client => client.vehicleId),
                users: this.clientManager.userClients.map(client => client.userId),
                connections: this.connectionManager.connectionPairs 
            };
            
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'clientData',
                    data: clientData
                }));
                console.log('Client data sent:', clientData);
            }

            // Handle browser messages
            ws.on('message', (message) => {
                this.handleBrowserMessage(ws, JSON.parse(message));
            });
        });

        // Start HTTP server
        this.server.listen(browserPort, () => {
            console.log(`HTTP server and WebSocket (Browser) running on port ${browserPort}...`);
        });
    }

    // Initialize WebSocket server for vehicles and users
    initWebSocketServers(vehicleUserPort) {
        this.vehicleUserWSS = new WebSocket.Server({ port: vehicleUserPort });

        this.vehicleUserWSS.on('connection', (ws, req) => {
            const clientIP = req.socket.remoteAddress;
            console.log(`New connection from client IP: ${clientIP}`);

            ws.on('message', (message) => {
                this.messageHandler.handleClientMessage(ws, JSON.parse(message), clientIP);
            });

            ws.on('close', () => {
                this.clientManager.handleClientDisconnection(ws);
            });
        });

        console.log(`WebSocket (Vehicle and User) server running on port ${vehicleUserPort}...`);
    }

    // Handle messages from the browser
    handleBrowserMessage(ws, parsedMessage) {
        if (parsedMessage.action === 'createConnection') {
            this.connectionManager.createConnection(parsedMessage.userId, parsedMessage.vehicleId);
        } else if (parsedMessage.action === 'disconnectConnection') {
            this.connectionManager.disconnectConnection(parsedMessage.userId, parsedMessage.vehicleId);
        }
    }
}

const serverManager = new WebSocketServerManager(8085, 8087);
