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

const generalToolBar = document.querySelector('#tool-bar__general');

generalToolBar.querySelector('.mode_physics').addEventListener('click', () => {
    threeAudioVisualization.switchMode('physics');
});