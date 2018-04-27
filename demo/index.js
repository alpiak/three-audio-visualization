/**
 * Created by qhyang on 2018/1/15.
 */

import { Howl } from 'howler';
import Clubber from 'clubber';

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
            threeAudioVisualization.shakeTile(tileAnimationToolBar.querySelector('.id').value, {
                color: tileAnimationToolBar.querySelector('.color').value || undefined
            });
            break;
        case 'rollover':
            threeAudioVisualization.rollOverTile(tileAnimationToolBar.querySelector('.id').value, {
                direction: tileAnimationToolBar.querySelector('.direction').value,
                color: tileAnimationToolBar.querySelector('.color').value || undefined
            });
            break;
        case 'float':
            threeAudioVisualization.floatTile(tileAnimationToolBar.querySelector('.id').value, 50);
    }
});

const tilesAnimationToolBar = document.querySelector('#tool-bar__tiles-animation');

tilesAnimationToolBar.querySelector('.wave').addEventListener('click', () => {
    threeAudioVisualization.waveTiles({
        type: {
            animationType: tilesAnimationToolBar.querySelector('.type').value,
            direction: tilesAnimationToolBar.querySelector('.direction').value
        },
        x: +tilesAnimationToolBar.querySelector('.x').value,
        y: +tilesAnimationToolBar.querySelector('.y').value,
        z: +tilesAnimationToolBar.querySelector('.z').value,
        speed: +tilesAnimationToolBar.querySelector('.speed').value,
        power: +tilesAnimationToolBar.querySelector('.power').value,
        color: tilesAnimationToolBar.querySelector('.color').value || undefined
    });
});

tilesAnimationToolBar.querySelector('.float-start').addEventListener('click', () => {
    threeAudioVisualization.startFloatingTiles(20);
});

tilesAnimationToolBar.querySelector('.float-stop').addEventListener('click', () => {
    threeAudioVisualization.stopFloatingTiles();
});

const layoutAnimationToolBar = document.querySelector('#tool-bar__layout-animation');

layoutAnimationToolBar.querySelector('.switch').addEventListener('click', () => {
    threeAudioVisualization.switchLayout(layoutAnimationToolBar.querySelector('.type').value);
});

let timeout;

const moveLight = () => {
    threeAudioVisualization.moveLight({
        x: -100 + 200 * Math.random(),
        y: 100 + 200 * Math.random(),
        z: 100,
        duration: 10000
    });

    timeout = setTimeout(() => {
        threeAudioVisualization.moveLight({
            x: -100 + 200 * Math.random(),
            y: 100 + 200 * Math.random(),
            z: 100,
            duration: 10000
        });
    }, 10000);
};

moveLight();

const interval = setInterval(moveLight, 20000);

const generalToolBar = document.querySelector('#tool-bar__general');

generalToolBar.querySelector('.mode_physics').addEventListener('click', () => {
    clearInterval(interval);
    clearTimeout(timeout);
    threeAudioVisualization.switchMode('physics');
});

generalToolBar.querySelector('.mode_basic').addEventListener('click', () => {
    threeAudioVisualization.switchMode('basic');
});

generalToolBar.querySelector('.show').addEventListener('click', () => {
    threeAudioVisualization.show();
    threeAudioVisualization.start();
    threeAudioVisualization.enableReactiveCamera();
});

generalToolBar.querySelector('.hide').addEventListener('click', () => {
    threeAudioVisualization.hide();
    threeAudioVisualization.pause();
});

const physicsToolBar = document.querySelector('#tool-bar__physics');

physicsToolBar.querySelector('.apply-force').addEventListener('click', () => {
   threeAudioVisualization.applyForces(...physicsToolBar.querySelector('.forces').value.split(',').map(force => +force));
});

let sound, clubber, active, bands = [];

physicsToolBar.querySelector('.load-audio-source').addEventListener('click', async () => {
    active = false;

    await new Promise((resolve, reject) => {
        if (this._sound) {
            this._sound.unload();
        }

        sound = new Howl({
            src: physicsToolBar.querySelector('.audio-source').value,
            html5: true,
            format: ['mp3']
        });

        sound.once('load', () => {
            resolve();
        });

        sound.once('loaderror', (id, err) => {
            reject(err);
        });
    });

    clubber = new Clubber({
        size: 2048,
        mute: false
    });

    clubber.listen(sound._sounds[0]._node);

    const bandWidth = +physicsToolBar.querySelector('.band-width').value;

    for (let i = 0; i < 128 / bandWidth; i++) {
        bands[i] = clubber.band({
            template: '01234',
            from: i * bandWidth,
            to: i * bandWidth + bandWidth,
            smooth: [0.1, 0.1, 0.1, 0.1, 0.1]
        });
    }

    const render = () => {
        clubber.update();

        let data = [];

        bands.forEach((band, index) => {
            data[index] = new Array(5);
            band(data[index]);
            threeAudioVisualization.applyForces(...data.map(band => Math.sqrt(band[3] * 1000000000)));
        });

        if (active) {
            requestAnimationFrame(render);
        }
    };

    requestAnimationFrame(() => {
        active = true;
        render();
    });

    sound.play();
});
