const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// Create HTTP server
const server = app.listen(8080, () => {
    console.log('HTTP/WS Server running on port 8080');
});

// Create WebSocket server attached to HTTP server
const wss = new WebSocket.Server({ server });

// Store active connections with user IDs
const clients = new Map();

wss.on('connection', (ws, req) => {
    console.log('New client connected');
    let isAlive = true;
    
    // Send immediate confirmation to client
    ws.send(JSON.stringify({type: 'connection', message: 'Connected to server'}));

    // Handle heartbeat
    const pingInterval = setInterval(() => {
        if (!isAlive) {
            clearInterval(pingInterval);
            return ws.terminate();
        }
        isAlive = false;
        ws.send(JSON.stringify({type: 'ping'}));
    }, 30000);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'pong') {
                isAlive = true;
                return;
            }

            // Store client connection if it includes user ID
            if (data.sender_id) {
                clients.set(data.sender_id, ws);
                console.log(`Client registered with ID: ${data.sender_id}`);
            }

            // Forward the message to the intended recipient
            if (data.receiver_id) {
                const receiverWs = clients.get(data.receiver_id);
                if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
                    receiverWs.send(JSON.stringify(data));
                }
            }
        } catch (err) {
            console.error('Error processing message:', err);
        }
    });

    ws.on('close', () => {
        clearInterval(pingInterval);
        console.log('Client disconnected');
        // Remove client from active connections
        for (const [userId, socket] of clients.entries()) {
            if (socket === ws) {
                clients.delete(userId);
                break;
            }
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clearInterval(pingInterval);
    });
});

// Basic health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});