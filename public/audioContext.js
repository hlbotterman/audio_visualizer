let audioContext, analyser, dataArray, bufferLength;
let currentTime = 0;
let isPlaying = false;
let audioBuffer, source;

// Initialize audio context
function initAudioContext(audioData) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    audioContext.decodeAudioData(audioData, (buffer) => {
        audioBuffer = buffer;
        createAudioSource();
        source.onended = () => {
            isPlaying = false;
            updatePlayPauseIcon();
        };
    }
    , (err) => {
        console.error('Error decoding audio:', err);
    });
}

// Create and manage audio source
function createAudioSource() {
    source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    analyser.fftSize = 1024;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    isPlaying = true;
    updatePlayPauseIcon();

    source.start(0, currentTime);
    visualizePolygon();
}

// Toggle audio playback
function toggleAudio() {
    if (isPlaying) {
        currentTime += audioContext.currentTime - currentTime;
        source.stop();
        isPlaying = false;
    } else if (audioBuffer) {
        createAudioSource();
        isPlaying = true;
    } else {
        console.error('No audio buffer available to resume');
    }
    updatePlayPauseIcon();
}

// Replay audio from the beginning
function replayAudio() {
    if (audioBuffer) {
        currentTime = 0;
        if (isPlaying) {
            source.stop();
        }
        createAudioSource();
    }
}

// Update play/pause icon
function updatePlayPauseIcon() {
    const pauseIcon = document.getElementById('pauseIcon');
    if (pauseIcon) {
        pauseIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }
}