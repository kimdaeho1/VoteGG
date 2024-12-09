require("dotenv").config();
var express = require("express");
var bodyParser = require("body-parser");
var http = require("http");
var OpenVidu = require("openvidu-node-client").OpenVidu;
var cors = require("cors");
var app = express();

const AWS = require('aws-sdk');
const s3 = new AWS.S3();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

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
const invitationRouter = require('./routes/invitation');
const debateResultRouter = require("./routes/debateResult"); //토론 결과 라우터
app.use(express.json());

const transcriptionRouter = require('./routes/transcription');
app.use('/api/transcription', transcriptionRouter);

// HTTP 라우터 추가
// app.use('/chat', chatRouter);
app.use('/api/user', userRouter);
app.use('/api/news', newsRouter);
app.use('/api/room', roomRouter); // 정책 뉴스 라우터
app.use('/api/invitation', invitationRouter);
app.use("/api/debate-result", debateResultRouter); //토론 결과 가져오기

///

// Enable CORS support
app.use(
  cors({
    origin: "*",
    methods: ['GET', 'POST', 'PUT'], // 허용할 HTTP 메서드
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
  //console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Failed to connect to MongoDB:', err);
});

mongoose.connection.on('connected', () => {
  //console.log('Mongoose connected to DB Cluster');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  //console.log('Mongoose disconnected');
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
  //console.log("Application started on port: ", SERVER_PORT);
  //console.warn('Application server connecting to OpenVidu at ' + OPENVIDU_URL);
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

app.post('/api/generate-presigned-url', (req, res) => {
  const { filename, contentType } = req.body;

  if (!filename || !contentType) {
      return res.status(400).json({ error: 'Filename and content type are required' });
  }

  console.log('AWS_BUCKET_NAME:', process.env.AWS_BUCKET_NAME);
  const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `uploads/images/${Date.now()}-${req.body.filename}`,
      Expires: 60, // URL 유효 시간 (초)
      ContentType: req.body.contentType,
      ACL: 'public-read'
  };

  s3.getSignedUrl('putObject', params, (err, url) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, POST, PUT');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.json({ url, key: params.Key });
  });
});

process.on('uncaughtException', err => console.error(err));