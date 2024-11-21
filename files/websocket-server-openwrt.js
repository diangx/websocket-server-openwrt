const WebSocket = require('ws');
const fs = require('fs');
const { exec } = require('child_process'); // 외부 명령 실행

const PORT = 8880;
const LOG_FILE = '/var/log/test';

// 로그 기록 함수
function logToFile(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFile(LOG_FILE, logMessage, (err) => {
        if (err) {
            console.error(`Failed to write to log file: ${err.message}`);
        }
    });
}

// WebSocket 서버 생성
const server = new WebSocket.Server({ port: PORT });

logToFile(`WebSocket server started on ws://localhost:${PORT}`);

server.on('connection', (socket) => {
    logToFile('New client connected.');

    socket.on('message', (message) => {
        logToFile(`Received message: ${message}`);

        try {
            // 클라이언트 요청 JSON 파싱
            const request = JSON.parse(message);

            if (request.method === 'ubus' && request.params) {
                const { id, params } = request;
                const { path, action, msg } = params;

                // path와 action 유효성 확인
                if (!path || !action) {
                    logToFile(`Invalid ubus request: missing path or action`);
                    socket.send(JSON.stringify({ jsonrpc: "2.0", id, error: 'Missing path or action' }));
                    return;
                }

                // ubus call 명령 생성
                const ubusCommand = `ubus call ${path} ${action} '${JSON.stringify(msg || {})}'`;

                // ubus call 명령 실행
                exec(ubusCommand, (error, stdout, stderr) => {
                    if (error) {
                        logToFile(`ubus call error: ${error.message}`);
                        socket.send(JSON.stringify({ jsonrpc: "2.0", id, error: error.message }));
                        return;
                    }

                    if (stderr) {
                        logToFile(`ubus call stderr: ${stderr}`);
                        socket.send(JSON.stringify({ jsonrpc: "2.0", id, error: stderr }));
                        return;
                    }

                    // ubus 호출 결과 JSON 파싱
                    let result;
                    try {
                        result = JSON.parse(stdout);
                    } catch (err) {
                        logToFile(`Failed to parse ubus response: ${err.message}`);
                        socket.send(JSON.stringify({ jsonrpc: "2.0", id, error: "Invalid ubus response format" }));
                        return;
                    }

                    // JSON-RPC 형식으로 결과 반환
                    const response = {
                        jsonrpc: "2.0",
                        id,
                        result
                    };

                    logToFile(`ubus call result: ${JSON.stringify(response)}`);
                    socket.send(JSON.stringify(response));
                });
            } else {
                logToFile(`Unsupported method or missing params: ${message}`);
                socket.send(JSON.stringify({ jsonrpc: "2.0", error: 'Unsupported method or missing params' }));
            }
        } catch (err) {
            logToFile(`Invalid message format: ${err.message}`);
            socket.send(JSON.stringify({ jsonrpc: "2.0", error: 'Invalid message format' }));
        }
    });

    socket.on('close', () => {
        logToFile('Client disconnected.');
    });

    socket.on('error', (err) => {
        logToFile(`WebSocket error: ${err.message}`);
    });
});
