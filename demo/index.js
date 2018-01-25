/**
 * Created by qhyang on 2018/1/15.
 */

import ThreeAudioVisualization from '../src/ThreeAudioVisualization';

const threeAudioVisualization = new ThreeAudioVisualization;

threeAudioVisualization.init(window.innerWidth, window.innerHeight, {
    accentColor: '#fff',
    accentIndices: [8]
});
threeAudioVisualization.mount(document.body);
threeAudioVisualization.start();
