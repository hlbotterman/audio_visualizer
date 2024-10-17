// Import required modules
const express = require('express');
const cors = require('cors');
const path = require('path');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');
const { exec } = require('child_process');
const fs = require('fs');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/download', handleDownload);

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Handle YouTube download and conversion
function handleDownload(req, res) {
    console.log("handleDownload called");
    const videoURL = req.query.url;
    console.log("Received request for video:", videoURL);

    if (!videoURL) {
        console.log("No YouTube URL provided");
        return res.status(400).json({ error: "A YouTube URL is required." });
    }

    downloadAndConvertAudio(videoURL, res);
}

// Download and convert audio from YouTube
function downloadAndConvertAudio(videoURL, res) {
    const audioFile = 'audio.mp3';
    const ytDlpCommand = `yt-dlp -f bestaudio --extract-audio --audio-format mp3 --output "${audioFile}" ${videoURL}`;

    console.log("Downloading audio with yt-dlp...");

    exec(ytDlpCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error downloading audio: ${stderr}`);
            return res.status(500).json({ error: "Error downloading audio." });
        }

        if (!fs.existsSync(audioFile)) {
            return res.status(500).json({ error: "Audio file not found or invalid." });
        }

        console.log("Audio downloaded, starting FFmpeg conversion...");
        convertToMp3(audioFile, res);
    });
}

// Convert audio to MP3 and send to client
function convertToMp3(audioFile, res) {
    res.header('Content-Disposition', `attachment; filename="audio.mp3"`);
    res.header('Content-Type', 'audio/mpeg');

    ffmpeg(audioFile)
        .audioCodec('libmp3lame')
        .format('mp3')
        .on('end', () => {
            console.log('Audio successfully sent to the client');
            deleteTemporaryFile(audioFile);
        })
        .on('error', (err) => {
            console.error('Error during conversion:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: "Error converting audio." });
            }
        })
        .pipe(res, { end: true });
}

// Delete temporary audio file
function deleteTemporaryFile(file) {
    fs.unlink(file, (err) => {
        if (err) console.error('Error deleting temporary file:', err);
    });
}