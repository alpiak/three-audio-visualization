/**
 * Created by qhyang on 2018/1/15.
 */

import ThreeAudioVisualization from '../src/ThreeAudioVisualization';

const threeAudioVisualization = new ThreeAudioVisualization;

threeAudioVisualization.init(window.innerWidth, window.innerHeight, {
    accentColor: '#fff',
    accentIndices: [6]
});
threeAudioVisualization.mount(document.body);
threeAudioVisualization.start();

const tileAnimationToolBar = document.querySelector('#tool-bar__tile-animation');

tileAnimationToolBar.querySelector('button').addEventListener('click', () => {
    const type = tileAnimationToolBar.querySelector('.type').value;

    switch (type) {
        case 'shake':
            threeAudioVisualization.shakeTile(tileAnimationToolBar.querySelector('.id').value);
            break;
        case 'rollover':
            threeAudioVisualization.rollOverTile(tileAnimationToolBar.querySelector('.id').value, {
                direction: tileAnimationToolBar.querySelector('.direction').value
            });
            break;
        case 'float':
            threeAudioVisualization.floatTile(tileAnimationToolBar.querySelector('.id').value, 50);
    }
});

const tilesAnimationToolBar = document.querySelector('#tool-bar__tiles-animation');

tilesAnimationToolBar.querySelector('.wave').addEventListener('click', () => {
    threeAudioVisualization.waveTiles({
        type: tilesAnimationToolBar.querySelector('.type').value,
        x: +tilesAnimationToolBar.querySelector('.x').value,
        y: +tilesAnimationToolBar.querySelector('.y').value,
        z: +tilesAnimationToolBar.querySelector('.z').value,
        speed: +tilesAnimationToolBar.querySelector('.speed').value,
        power: +tilesAnimationToolBar.querySelector('.power').value,
        color: tilesAnimationToolBar.querySelector('.color').value || undefined
    });
});

tilesAnimationToolBar.querySelector('.float-start').addEventListener('click', () => {
    threeAudioVisualization.startFloatingTiles(50);
});

tilesAnimationToolBar.querySelector('.float-stop').addEventListener('click', () => {
    threeAudioVisualization.stopFloatingTiles();
});

const layoutAnimationToolBar = document.querySelector('#tool-bar__layout-animation');

layoutAnimationToolBar.querySelector('.switch').addEventListener('click', () => {
    threeAudioVisualization.switchLayout(layoutAnimationToolBar.querySelector('.type').value);
});

const moveLight = () => {
    threeAudioVisualization.moveLight({
        x: -100 + 200 * Math.random(),
        y: 100 + 200 * Math.random(),
        z: 100,
        duration: 10000
    });

    setTimeout(() => {
        threeAudioVisualization.moveLight({
            x: -100 + 200 * Math.random(),
            y: 100 + 200 * Math.random(),
            z: 100,
            duration: 10000
        });
    }, 10000);
};

moveLight();
setInterval(moveLight, 20000);

const generalToolBar = document.querySelector('#tool-bar__general');

generalToolBar.querySelector('.mode_physics').addEventListener('click', () => {
    threeAudioVisualization.switchMode('physics');
});
