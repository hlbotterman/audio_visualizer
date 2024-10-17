const controlsMenu = document.getElementById('controlsMenu');
const toggleButton = document.getElementById('toggleControls');

toggleButton.addEventListener('click', () => {
    controlsMenu.classList.toggle('closed');
    if (controlsMenu.classList.contains('closed')) {
        toggleButton.innerHTML = '<i class="fas fa-angle-right"></i>';
    } else {
        toggleButton.innerHTML = '<i class="fas fa-angle-left"></i>';
    }
});
