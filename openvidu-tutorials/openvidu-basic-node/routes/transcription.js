const express = require('express');
const router = express.Router();
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

ffmpeg.setFfmpegPath(ffmpegPath);

// temp 디렉토리가 없으면 생성
const tempDir = path.join(__dirname, '../temp/audio');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '.webm');
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const validMimeTypes = ['audio/webm', 'audio/webm;codecs=opus'];
        if (validMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type. Received: ${file.mimetype}`));
        }
    }
});

router.post('/convert', upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No audio file provided' });
    }

    const inputPath = req.file.path;
    const outputPath = inputPath.replace('.webm', '.wav');

    try {
        // FFmpeg 변환 전 파일 존재 확인
        if (!fs.existsSync(inputPath)) {
            throw new Error('Input file does not exist');
        }

        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(inputPath)
                .inputOptions([
                    '-f', 'webm',
                    '-acodec', 'libopus'
                ])
                .outputOptions([
                    '-ac', '1',
                    '-ar', '16000',
                    '-acodec', 'pcm_s16le',
                    '-f', 'wav'
                ])
                .on('start', (commandLine) => {
                    console.log('FFmpeg 명령어:', commandLine);
                })
                .on('error', (err, stdout, stderr) => {
                    console.error('FFmpeg 에러:', err);
                    console.error('FFmpeg stderr:', stderr);
                    reject(err);
                })
                .on('end', resolve)
                .save(outputPath);
        });

        // 변환된 파일 확인
        if (!fs.existsSync(outputPath)) {
            throw new Error('FFmpeg conversion failed - output file not created');
        }

        // Whisper API 호출
        const formData = new FormData();
        formData.append('file', fs.createReadStream(outputPath));
        formData.append('model', 'whisper-1');
        formData.append('language', 'ko');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.WHISPER_API_KEY}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Whisper API Error:', errorText);
            throw new Error(`Whisper API error: ${response.statusText}`);
        }

        const result = await response.json();

        // 임시 파일 정리
        try {
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
        } catch (err) {
            console.error('Error cleaning up files:', err);
        }

        res.json({ text: result.text });
    } catch (error) {
        console.error('Error in transcription:', error);
        // 에러 발생 시에도 임시 파일 정리
        try {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (err) {
            console.error('Error cleaning up files:', err);
        }
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;