require("dotenv").config(!!process.env.CONFIG ? { path: process.env.CONFIG } : {});
var express = require("express");
var bodyParser = require("body-parser");
var http = require("http");
var OpenVidu = require("openvidu-node-client").OpenVidu;
var cors = require("cors");
var app = express();

const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

// Environment variable: PORT where the node server is listening
var SERVER_PORT = process.env.SERVER_PORT || 5000;
// Environment variable: URL where our OpenVidu server is listening
var OPENVIDU_URL = process.env.OPENVIDU_URL || 'http://localhost:4443';
// Environment variable: secret shared with our OpenVidu server
var OPENVIDU_SECRET = process.env.OPENVIDU_SECRET || 'MY_SECRET';



const { chatSocketHandler } = require('./routes/chat');
const { timerSocketHandler } = require('./routes/timer');
const userRouter = require('./routes/user');
const newsRouter = require('./routes/newsRouter'); // 정책 뉴스 라우터
const roomRouter = require('./routes/room'); // 룸생성 라우터
app.use(express.json());



// HTTP 라우터 추가
// app.use('/chat', chatRouter);
app.use('/api/user', userRouter);
app.use('/api/news', newsRouter);
app.use('/api/room', roomRouter); // 정책 뉴스 라우터
///

// Enable CORS support
app.use(
  cors({
    origin: "*",
  })
);

var server = http.createServer(app);
var openvidu = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);

///
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  path: '/socket.io/',
  transports: ['websocket'],
});

// 소켓 핸들러 추가
chatSocketHandler(io);
timerSocketHandler(io);

///////////////////////////

// MongoDB 연결
const mongoUri = process.env.MONGODB_URI;
mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 10000, // 서버 선택 타임아웃 10초
  socketTimeoutMS: 45000, // 소켓 타임아웃 45초
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Failed to connect to MongoDB:', err);
});

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB Cluster');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;

//////////////////////////////////////////

// Allow application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// Allow application/json
app.use(bodyParser.json());


// 썸네일 이미지 업로드
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


// Serve static resources if available
app.use(express.static(__dirname + '/public'));

// Serve application
server.listen(SERVER_PORT, () => {
  console.log("Application started on port: ", SERVER_PORT);
  console.warn('Application server connecting to OpenVidu at ' + OPENVIDU_URL);
});

app.post("/api/sessions", async (req, res) => {
  var session = await openvidu.createSession(req.body);
  res.send(session.sessionId);
});

app.post("/api/sessions/:sessionId/connections", async (req, res) => {
  var session = openvidu.activeSessions.find(
    (s) => s.sessionId === req.params.sessionId
  );
  if (!session) {
    res.status(404).send();
  } else {
    var connection = await session.createConnection(req.body);
    res.send(connection.token);
  }
});

process.on('uncaughtException', err => console.error(err));