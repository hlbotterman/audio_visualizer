// Initialize application
function init() {
    initVisualizer();
    initUIControls();
    resizeCanvas();

    // Add event listener for window resize
    window.addEventListener('resize', resizeCanvas);
}

// Resize canvas to fit container
function resizeCanvas() {
    const canvas = document.getElementById('audioCanvas');
    const container = document.querySelector('.canvas-container');

    const size = Math.min(container.clientWidth, container.clientHeight);
    canvas.width = size;
    canvas.height = size;

    if (typeof updateVisualizerSize === 'function') {
        updateVisualizerSize(canvas.width, canvas.height);
    }
}

// Run initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
