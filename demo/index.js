/**
 * Created by qhyang on 2018/1/15.
 */

import ThreeAudioVisualization from '../src/ThreeAudioVisualization';

const threeAudioVisualization = new ThreeAudioVisualization;

threeAudioVisualization.init(window.innerWidth, window.innerHeight);
threeAudioVisualization.mount(document.body);
threeAudioVisualization.start();

const tileAnimationToolBar = document.querySelector('#tool-bar__tile-animation');

tileAnimationToolBar.querySelector('button').addEventListener('click', () => {
    const type = tileAnimationToolBar.querySelector('.type').value;

    switch (type) {
        case 'shake':
            threeAudioVisualization.shakeTile(tileAnimationToolBar.querySelector('input').value);
            break;
        case 'rollover':
            threeAudioVisualization.rollOverTile(tileAnimationToolBar.querySelector('input').value, {
                direction: tileAnimationToolBar.querySelector('.direction').value
            });
            break;
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
