// Initialize UI controls
function initUIControls() {
    document.getElementById('loadAudio').addEventListener('click', handleYoutubeLink);
    document.getElementById('pauseAudio').addEventListener('click', toggleAudio);
    document.getElementById('replayAudio').addEventListener('click', replayAudio);
    document.getElementById('colorSelect').addEventListener('change', updateVisualizationOptions);
    document.getElementById('particleCount').addEventListener('input', updateParticleCount);
    document.getElementById('sideCount').addEventListener('input', updateSideCount);
}

// Handle YouTube link input
function handleYoutubeLink() {
    const youtubeLink = document.getElementById('youtubeLink').value.trim();
    if (!youtubeLink) {
        alert("Please enter a valid YouTube link");
        return;
    }

    const loadButton = document.getElementById('loadAudio');
    loadButton.classList.add('loading');

    console.log("Sending request to server with URL:", youtubeLink);

    const encodedUrl = encodeURIComponent(youtubeLink);
    const baseUrl = window.location.origin;
    console.log(`Sending request to ${baseUrl}/download with URL: ${encodedUrl}`);

    fetch(`${baseUrl}/download?url=${encodedUrl}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch audio');
            }
            console.log("Audio fetched successfully.");
            return response.arrayBuffer();
        })
        .then(audioData => {
            console.log('Audio fetched, attempting to decode');
            setTimeout(() => initAudioContext(audioData), 500);
            loadButton.classList.remove('loading');
        })
        .catch(err => {
            console.error('Error fetching or decoding audio:', err);
            loadButton.classList.remove('loading');
        })
}

// Update particle count display
function updateParticleCount() {
    document.getElementById('particleCountValue').textContent = this.value;
    updateVisualizationOptions();
}

// Update side count display
function updateSideCount() {
    document.getElementById('sideCountValue').textContent = this.value;
    updateVisualizationOptions();
}