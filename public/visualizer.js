let canvas, canvasContext;
let animationId;
let mouseX = null, mouseY = null;

// Visualization options
const visualizationOptions = {
    baseColor: '#00ae84',
    accentColor: '#009186',
    backgroundColor: '#000011',
    smoothingFactor: 0.3,
    bassReactivity: 0.05,
    particleCount: 100,
    numberOfSides: 10
};

const colorOptions = {
    blue: { baseColor: '#00ae84', accentColor: '#009186', backgroundColor: '#000011' },
    red: { baseColor: '#FF0000', accentColor: '#FFA500', backgroundColor: '#110000' },
    green: { baseColor: '#00FF00', accentColor: '#ADFF2F', backgroundColor: '#001100' },
    yellow: { baseColor: '#FFFF00', accentColor: '#FFD700', backgroundColor: '#111100' },
    gray: { baseColor: '#888888', accentColor: '#CCCCCC', backgroundColor: '#111111' }
};

// Initialize visualizer
function initVisualizer() {
    canvas = document.getElementById('audioCanvas');
    canvasContext = canvas.getContext('2d');

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    drawBackground();

}

// Handle mouse movement
function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
}

// Handle mouse leave
function handleMouseLeave() {
    mouseX = null;
    mouseY = null;
}

// Update visualization options
function updateVisualizationOptions() {
    const selectedColor = document.getElementById('colorSelect').value;
    const particleCount = parseInt(document.getElementById('particleCount').value, 10) || 40;
    const numberOfSides = Math.max(3, parseInt(document.getElementById('sideCount').value, 10) || 50);

    Object.assign(visualizationOptions, colorOptions[selectedColor], { particleCount, numberOfSides });

    if (isPlaying) {
        cancelAnimationFrame(animationId);
        visualizePolygon();
    } else {
        drawBackground();
    }
}

// Draw background
function drawBackground() {
    canvasContext.fillStyle = visualizationOptions.backgroundColor;
    canvasContext.fillRect(0, 0, canvas.width, canvas.height);
}

// Update visualizer size
function updateVisualizerSize(width, height) {
    canvas.width = width;
    canvas.height = height;
    drawBackground();
}

// Draw inner polygon
function drawInnerPolygonWithGradient(ctx, vertices, centerX, centerY, innerRadius, baseColor, accentColor) {
    ctx.shadowColor = `rgba(${hexToRgb(accentColor)}, 0.6)`;
    ctx.shadowBlur = 50;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, innerRadius);

    gradient.addColorStop(0, `rgba(${hexToRgb(baseColor)}, 0.2)`);
    gradient.addColorStop(0.7, `rgba(${hexToRgb(accentColor)}, 0.1)`);
    gradient.addColorStop(1, `rgba(${hexToRgb(accentColor)}, 0)`);

    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
        ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowColor = 'transparent';
}

// Draw polygon with gradient
function drawPolygonGradient(ctx, centerX, centerY, outerRadius, numberOfSides, baseColor, accentColor) {
    const angleStep = (2 * Math.PI) / numberOfSides;

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, outerRadius);
    gradient.addColorStop(0, `rgba(${hexToRgb(baseColor)}, 0.5)`);
    gradient.addColorStop(0.5, `rgba(${hexToRgb(accentColor)}, 0.3)`);
    gradient.addColorStop(1, `rgba(${hexToRgb(accentColor)}, 0.0)`);

    ctx.beginPath();
    for (let i = 0; i < numberOfSides; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * outerRadius;
        const y = centerY + Math.sin(angle) * outerRadius;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();

    ctx.fillStyle = gradient;
    ctx.fill();
}

// Main visualization function
function visualizePolygon() {
    const {
        baseColor,
        accentColor,
        backgroundColor,
        smoothingFactor,
        bassReactivity,
        particleCount,
        numberOfSides
    } = visualizationOptions;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = Math.min(centerX, centerY) * 0.48;
    let innerRadius = outerRadius * 0.3;

    let previousDataArray = new Uint8Array(analyser.frequencyBinCount);

    const outerPolygonVertices = [];
    const angleStep = (2 * Math.PI) / numberOfSides;
    for (let i = 0; i < numberOfSides; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * outerRadius;
        const y = centerY + Math.sin(angle) * outerRadius;
        outerPolygonVertices.push({ x, y });
    }

    const desiredTotalBars = 180;
    const barsPerSide = Math.floor(desiredTotalBars / numberOfSides);
    const positions = [];

    for (let i = 0; i < numberOfSides; i++) {
        const startVertex = outerPolygonVertices[i];
        const endVertex = outerPolygonVertices[(i + 1) % numberOfSides];

        for (let j = 0; j < barsPerSide; j++) {
            const t = j / barsPerSide;
            const x = startVertex.x + (endVertex.x - startVertex.x) * t;
            const y = startVertex.y + (endVertex.y - startVertex.y) * t;

            const dx = endVertex.y - startVertex.y;
            const dy = -(endVertex.x - startVertex.x);
            const length = Math.hypot(dx, dy);
            const nx = dx / length;
            const ny = dy / length;

            positions.push({
                xStart: x,
                yStart: y,
                dx: nx,
                dy: ny
            });
        }
    }

    let innerPolygonVertices = [];

    function updateInnerPolygonVertices() {
        let pulseFactor = Math.cos(Date.now() / 200) * Math.sin(Date.now() / 300) * 0.4;
        let animatedInnerRadius = innerRadius * (1 + pulseFactor);

        innerPolygonVertices = [];
        for (let i = 0; i < numberOfSides; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const x = centerX + Math.cos(angle) * outerRadius * animatedInnerRadius/outerRadius;
            const y = centerY + Math.sin(angle) * outerRadius * animatedInnerRadius/outerRadius;
            innerPolygonVertices.push({ x, y });
        }
    }

    updateInnerPolygonVertices();
    drawInnerPolygonWithGradient(canvasContext, innerPolygonVertices, centerX, centerY, innerRadius, baseColor, accentColor);

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            const point = randomPointInPolygon(innerPolygonVertices);
            this.x = point.x;
            this.y = point.y;
            this.size = Math.random() * 3 + 1;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.life = 255;
        }

        update(bassValue) {
            if (mouseX !== null && mouseY !== null) {
                const dxMouse = mouseX - this.x;
                const dyMouse = mouseY - this.y;
                const distanceMouse = Math.hypot(dxMouse, dyMouse);
                const forceMouse = 1 / Math.max(distanceMouse, 50);

                this.speedX += dxMouse * forceMouse * 0.05;
                this.speedY += dyMouse * forceMouse * 0.05;
            }

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const dxCenter = centerX - this.x;
            const dyCenter = centerY - this.y;
            const distanceCenter = Math.hypot(dxCenter, dyCenter);
            const forceCenter = 1 / Math.max(distanceCenter, 50);


            this.speedX += dxCenter * forceCenter * 0.1;
            this.speedY += dyCenter * forceCenter * 0.1;

            this.x += this.speedX * (1 + bassValue / 50);
            this.y += this.speedY * (1 + bassValue / 50);
            this.life -= 1;

            if (this.life <= 0 || !isPointInPolygon(this.x, this.y, innerPolygonVertices)) {
                this.reset();
            }
        }

        draw(ctx) {
            const alpha = this.life / 255;
            ctx.fillStyle = `rgba(${hexToRgb(accentColor)}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }


    const particles = Array.from({ length: particleCount }, () => new Particle());

    drawPolygonGradient(canvasContext, centerX, centerY, outerRadius, numberOfSides, baseColor, accentColor);


    function drawPolygon() {
        animationId = requestAnimationFrame(drawPolygon);

        analyser.getByteFrequencyData(dataArray);

        for (let i = 0; i < dataArray.length; i++) {
            dataArray[i] = dataArray[i] * (1 - smoothingFactor) + previousDataArray[i] * smoothingFactor;
        }

        const bassValue = dataArray.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
        innerRadius = outerRadius * 0.5 * (1 + bassValue / 255 * bassReactivity);
        updateInnerPolygonVertices(innerRadius / outerRadius);

        canvasContext.clearRect(0, 0, canvas.width, canvas.height);

        drawPolygonGradient(canvasContext, centerX, centerY, outerRadius, numberOfSides, baseColor, accentColor);

        canvasContext.beginPath();
        canvasContext.moveTo(outerPolygonVertices[0].x, outerPolygonVertices[0].y);
        for (let i = 1; i < outerPolygonVertices.length; i++) {
            canvasContext.lineTo(outerPolygonVertices[i].x, outerPolygonVertices[i].y);
        }
        canvasContext.closePath();
        canvasContext.strokeStyle = `rgba(${hexToRgb(accentColor)}, 0.2)`;
        canvasContext.stroke();

        particles.forEach(particle => {
            particle.update(bassValue);
            particle.draw(canvasContext);
        });

        canvasContext.lineWidth = 3;
        for (let i = 0; i < positions.length; i++) {
            const dataIndex = Math.floor(i * dataArray.length / positions.length);
            const barHeight = dataArray[dataIndex] * outerRadius / 255;

            const xStart = positions[i].xStart;
            const yStart = positions[i].yStart;
            const xEnd = xStart + positions[i].dx * barHeight;
            const yEnd = yStart + positions[i].dy * barHeight;

            canvasContext.strokeStyle = `rgba(${hexToRgb(accentColor)}, 0.8)`;
            canvasContext.beginPath();
            canvasContext.moveTo(xStart, yStart);
            canvasContext.lineTo(xEnd, yEnd);
            canvasContext.stroke();

            if (Math.random() < 0.02) {
                canvasContext.strokeStyle = accentColor;
                canvasContext.lineWidth = 1;
                canvasContext.beginPath();
                canvasContext.moveTo(xEnd, yEnd);
                canvasContext.lineTo(
                    xEnd + (Math.random() - 0.5) * 20,
                    yEnd + (Math.random() - 0.5) * 20
                );
                canvasContext.stroke();
            }
        }

        canvasContext.beginPath();
        canvasContext.moveTo(innerPolygonVertices[0].x, innerPolygonVertices[0].y);
        for (let i = 1; i < innerPolygonVertices.length; i++) {
            canvasContext.lineTo(innerPolygonVertices[i].x, innerPolygonVertices[i].y);
        }
        canvasContext.closePath();
        canvasContext.fillStyle = `rgba(${hexToRgb(baseColor)}, 0.3)`;
        canvasContext.fill();

        previousDataArray.set(dataArray);
    }

    drawPolygon();

    function randomPointInPolygon(polygon) {
        let minX = polygon[0].x, maxX = polygon[0].x;
        let minY = polygon[0].y, maxY = polygon[0].y;
        for (let i = 1; i < polygon.length; i++) {
            const v = polygon[i];
            minX = Math.min(minX, v.x);
            maxX = Math.max(maxX, v.x);
            minY = Math.min(minY, v.y);
            maxY = Math.max(maxY, v.y);
        }

        let x, y;
        let attempts = 0;
        do {
            x = Math.random() * (maxX - minX) + minX;
            y = Math.random() * (maxY - minY) + minY;
            attempts++;
            if (attempts > 1000) break;
        } while (!isPointInPolygon(x, y, polygon));

        return { x, y };
    }

    function isPointInPolygon(x, y, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;

            const intersect = ((yi > y) !== (yj > y)) &&
                (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }
}

// Utility function to convert hex to RGB
function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
}

console.log('visualizer.js loaded');