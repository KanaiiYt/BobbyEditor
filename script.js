// script.js

const gridElement = document.getElementById('grid');

for (let i = 0; i < 900; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    gridElement.appendChild(cell);
}

const colorCounters = {};

fetch('config.json')
    .then(response => response.json())
    .then(data => {
        const sidebar = document.getElementById('sidebar');
        const toolsContainer = document.getElementById('tools');
        const arrow = createArrow('images/arrow.png');

        data.buttons.forEach(button => {
            const btn = createSidebarButton(button);
            sidebar.appendChild(btn);
        });

        data.tools.forEach(tool => {
            const toolButton = createToolButton(tool);
            toolsContainer.appendChild(toolButton);
        });

        let isMouseDown = false;
        document.addEventListener('mousedown', () => isMouseDown = true);
        document.addEventListener('mouseup', () => isMouseDown = false);

        gridElement.addEventListener('mouseover', handleMouseEvent);
        gridElement.addEventListener('click', handleMouseEvent);

        function handleMouseEvent(event) {
            const cell = event.target;
            const eraseToolSelected = toolsContainer.querySelector('.eraseTool.selected');
            const paintToolSelected = toolsContainer.querySelector('.paintTool.selected');
            const flipToolSelected = toolsContainer.querySelector('.flipTool.selected');
            const selectedButton = sidebar.querySelector('.sidebar-button.selected');
        
            if (cell.classList.contains('cell') && (isMouseDown || event.type === 'click')) {
                const color = selectedButton ? selectedButton.dataset.color : null;
                const buttonClass = selectedButton ? selectedButton.classList[1] : null;
                const maxCount = selectedButton ? parseInt(selectedButton.querySelector('.counter').dataset.max, 10) : null;
                const shape = selectedButton ? selectedButton.dataset.shape : null;
        
                if (eraseToolSelected) {
                    if (cell.style.backgroundColor) {
                        decrementCounter(cell.style.backgroundColor);
                        resetCell(cell);
                    }
                } else if (paintToolSelected && selectedButton) {
                    const currentColor = cell.style.backgroundColor;
        
                    if (currentColor !== color) {
                        if (currentColor) {
                            decrementCounter(currentColor);
                        }
                        if (maxCount === 0 || colorCounters[buttonClass] < maxCount) {
                            resetCell(cell);
                            cell.style.backgroundColor = color;
                            applyShape(cell, shape);
                            cell.classList.add(buttonClass);
                            incrementCounter(selectedButton, buttonClass, maxCount);
                        }
                    }
                } else if (cell.classList.contains('spike')) {
                    if (flipToolSelected) {
                        rotateSpikeShape(cell);
                    }
                }
            }
        }
        
        function rotateSpikeShape(cell) {
            const currentRotation = cell.dataset.rotation ? parseInt(cell.dataset.rotation, 10) : 0;
            const newRotation = (currentRotation + 90) % 360;
        
            cell.style.transform = `rotate(${newRotation}deg)`;
            cell.dataset.rotation = newRotation;
        
            for (let i = 1; i <= 3; i++) {
                cell.classList.remove(`class-${i}`);
            }
        
            const stateClass = (currentRotation / 90 + 1) % 4;
            cell.classList.add(`class-${stateClass + 1}`);
            
            if (newRotation !== 0) {
                cell.classList.add('rotated');
            } else {
                cell.classList.remove('rotated');
            }
        }        
        
        document.querySelectorAll('.cell.spike').forEach(cell => {
            cell.addEventListener('click', () => rotateSpikeShape(cell));
        });
        
        function createArrow(src) {
            const arrow = document.createElement('img');
            arrow.src = src;
            arrow.style.position = 'absolute';
            arrow.style.display = 'none';
            arrow.style.width = '20px';
            arrow.style.height = '20px';
            document.body.appendChild(arrow);
            return arrow;
        }

        function createSidebarButton(button) {
            const btn = document.createElement('button');
            btn.classList.add('sidebar-button', button.class);
            btn.innerHTML = `
                <img src="${button.image || 'images/default.png'}" alt="${button.title}">
                <div class="button-text">
                    <strong>${button.title}</strong>
                    <span>${button.description}</span>
                </div>
            `;

            const counterElement = document.createElement('div');
            counterElement.classList.add('counter');
            counterElement.dataset.max = button.max || 0;
            counterElement.textContent = `0${button.max ? '/' + button.max : ''}`;
            btn.appendChild(counterElement);

            btn.dataset.color = button.color;
            btn.dataset.shape = button.shape || 'square';
            colorCounters[button.class] = 0;

            btn.addEventListener('click', () => {
                document.querySelectorAll('.sidebar-button').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });

            return btn;
        }

        function createToolButton(tool) {
            const toolButton = document.createElement('button');
            toolButton.classList.add('tool-button', tool.class);
            toolButton.innerHTML = `<img src="${tool.image}" alt="Outil">`;
        
            if (tool.class === 'paintTool') {
                toolButton.classList.add('selected');
                displayArrow(arrow, toolButton);
            }
        
            if (tool.class === 'flipTool') {
                toolButton.addEventListener('click', () => {
                    document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('selected'));
                    toolButton.classList.add('selected');
                    displayArrow(arrow, toolButton);
                });
            }
        
            toolButton.addEventListener('click', () => {
                document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('selected'));
                toolButton.classList.add('selected');
                displayArrow(arrow, toolButton);
            });
        
            return toolButton;
        }

        function applyShape(cell, shape) {
            cell.classList.remove('circle', 'triangle', 'square');
            if (shape) {
                cell.classList.add(shape);
            }
        }

        function resetCell(cell) {
            cell.style.backgroundColor = '';
            const classList = Array.from(cell.classList);
            classList.forEach(className => {
                if (className !== 'cell') {
                    cell.classList.remove(className);
                }
            });
        }

        function displayArrow(arrow, button) {
            arrow.style.display = 'block';
            const rect = button.getBoundingClientRect();
            arrow.style.left = `${rect.left + rect.width / 2 - arrow.width / 2}px`;
            arrow.style.top = `${rect.bottom}px`;
        }

        function incrementCounter(button, buttonClass, maxCount) {
            colorCounters[buttonClass]++;
            updateCounter(button, buttonClass, maxCount);
        }

        function decrementCounter(color) {
            const button = Array.from(sidebar.querySelectorAll('.sidebar-button')).find(b => b.dataset.color === color);
            if (button) {
                const buttonClass = button.classList[1];
                if (colorCounters[buttonClass] > 0) {
                    colorCounters[buttonClass]--;
                    const maxCount = parseInt(button.querySelector('.counter').dataset.max, 10);
                    updateCounter(button, buttonClass, maxCount);
                }
            }
        }

        function updateCounter(button, buttonClass, maxCount) {
            const counterElement = button.querySelector('.counter');
            counterElement.textContent = maxCount > 0
                ? `${colorCounters[buttonClass]}/${maxCount}`
                : `${colorCounters[buttonClass]}`;
        }
    });

    document.getElementById('buildButton').addEventListener('click', function () {
        const cells = document.querySelectorAll('#grid .cell');
        const hasPlayerSpawn = Array.from(cells).some(cell => cell.classList.contains('playerSpawn'));
        const hasEnd = Array.from(cells).some(cell => cell.classList.contains('end'));
    
        if (!hasPlayerSpawn || !hasEnd) {
            alert("Vous devez mettre au moins 1 début et 1 fin !!!");
            return;
        }
    
        let maxX = 0;
        let maxY = 0;
        let endX = 2860;
        let endY = 240;
    
        const levelData = {
            level1: {
                world: { width: 0, height: 0 },
                player: { x: 80, y: 320 },
                target: { x: endX, y: endY },
                hills: [],
                hillsFront: [],
                clouds: {
                    y: { min: 60, max: 180 },
                    x: [-100, 400, 900, 1440, 1600, 2000],
                },
                platforms: [],
                oneWayPlatforms: [],
                enemies: [],
                spikes: [],
                coins: [],
                fallingBlocks: [],
                spikyBalls: []
            }
        };
    
        cells.forEach((cell, index) => {
            const row = Math.floor(index / 30);
            const col = index % 30;
            const x = col * 40;
            const y = row * 40;
    
            if (cell.classList.contains('solButton') || cell.classList.contains('enemy') || cell.classList.contains('spike') || cell.classList.contains('playerSpawn')) {
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
    
            if (cell.classList.contains('solButton')) {
                levelData.level1.platforms.push({ x: x, y: y, width: 40, height: 40 });
            } else if (cell.classList.contains('spike')) {
                const rotationState = cell.dataset.rotation ? parseInt(cell.dataset.rotation, 10) : 0;
                const dir = rotationState / 90;
                levelData.level1.spikes.push({ x: x, y: y, dir: dir });
            } else if (cell.classList.contains('playerSpawn')) {
                levelData.level1.player = { x: x, y: y };
            }
    
            if (cell.classList.contains('end')) {
                endX = x;
                endY = y;
            }
    
            if (cell.classList.contains('enemy')) {
                levelData.level1.enemies.push({ x: x, y: y });
            }
    
            if (cell.classList.contains('fall')) {
                levelData.level1.fallingBlocks.push({ x: x, y: y });
            }
    
            if (cell.classList.contains('spikyBall')) {
                levelData.level1.spikyBalls.push({ x: x, y: y });
            }
    
            if (cell.classList.contains('coin')) {
                levelData.level1.coins.push({ x: x, y: y });
            }
    
            if (cell.classList.contains('oneway')) {
                levelData.level1.oneWayPlatforms.push({ x: x, y: y, width: 40 });
            }
        });
    
        levelData.level1.world.width = maxX + 40;
        levelData.level1.world.height = maxY + 40;
        levelData.level1.target = { x: endX, y: endY };
        const jsonString = JSON.stringify(levelData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
    
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'level1.json';
        document.body.appendChild(downloadLink); 
        downloadLink.click();
    
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
    });
    
    document.getElementById('saveButton').addEventListener('click', function () {
        const cells = document.querySelectorAll('#grid .cell');
        let fileContent = '';
    
        cells.forEach((cell, index) => {
            const cellNumber = `C${index + 1}`;
            const cellClass = Array.from(cell.classList).filter(c => c !== 'cell').join(', ') || 'none';
            const color = cell.style.backgroundColor || 'none';
            let shape = 'none';
            if (cell.classList.contains('square')) shape = 'square';
            else if (cell.classList.contains('circle')) shape = 'circle';
            else if (cell.classList.contains('triangle')) shape = 'triangle';
            const dir = cell.dataset.rotation || 'none';
    
            fileContent += `${cellNumber}:\n`;
            fileContent += `class: ${cellClass}\n`;
            fileContent += `color: ${color}\n`;
            fileContent += `shape: ${shape}\n`;
            fileContent += `dir: ${dir}\n`;
            fileContent += '\n';
        });
    
        const blob = new Blob([fileContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'grid-data.txt';
        link.click();
        URL.revokeObjectURL(url);
    });
    
    document.getElementById('loadButton').addEventListener('click', function () {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt';
    
        input.addEventListener('change', function () {
            const file = input.files[0];
            if (!file) return;
    
            const reader = new FileReader();
            reader.onload = function (e) {
                const content = e.target.result;
                loadGridFromContent(content);
            };
            reader.readAsText(file);
        });
    
        input.click();
    });
    
    function loadGridFromContent(content) {
        const cells = document.querySelectorAll('#grid .cell');
        const lines = content.split('\n');
        let currentIndex = -1;
    
        lines.forEach(line => {
            line = line.trim();
            if (!line) return;
    
            const cellMatch = line.match(/^C(\d+):$/);
            if (cellMatch) {
                currentIndex = parseInt(cellMatch[1], 10) - 1;
                return;
            }
    
            if (currentIndex >= 0 && currentIndex < cells.length) {
                const cell = cells[currentIndex];
                const [key, value] = line.split(':').map(part => part.trim());
    
                switch (key) {
                    case 'class':
                        resetCellClasses(cell);
                        value.split(', ').forEach(cls => {
                            if (cls !== 'none') cell.classList.add(cls);
                        });
                        break;
                    case 'color':
                        cell.style.backgroundColor = value === 'none' ? '' : value;
                        break;
                    case 'shape':
                        resetCellShape(cell);
                        if (value !== 'none') cell.classList.add(value);
                        break;
                    case 'dir':
                        const rotation = value === 'none' ? 0 : parseInt(value, 10);
                        cell.style.transform = `rotate(${rotation}deg)`;
                        cell.dataset.rotation = rotation;
                        break;
                    default:
                        console.warn(`Unrecognized property: ${key}`);
                        break;
                }
            }
        });
    }
    
    function resetCellClasses(cell) {
        const shapeClasses = ['square', 'circle', 'triangle'];
        shapeClasses.forEach(shape => cell.classList.remove(shape));
        cell.classList.forEach(cls => {
            if (cls !== 'cell') cell.classList.remove(cls);
        });
    }
    
    function resetCellShape(cell) {
        cell.classList.remove('square', 'circle', 'triangle');
    }   

    function loadCSS(filename) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = filename;
        document.head.appendChild(link);
    }
    
    function loadJS(filename) {
        var script = document.createElement("script");
        script.src = filename;
        document.body.appendChild(script);
    }
    
    // Appelez ces fonctions pour charger vos fichiers CSS et JS
    loadCSS("styles.css");
    loadJS("script.js");

    document.getElementById('playButton').addEventListener('click', function () {
        // Ouvrir Bobby.html dans une nouvelle fenêtre
        window.open('Bobby.html', '_blank');
    });
