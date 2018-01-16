/**
 * Created by qhyang on 2018/1/15.
 */

import ThreeAudioVisualization from '../src/ThreeAudioVisualization';

const threeAudioVisualization = new ThreeAudioVisualization;

threeAudioVisualization.init(window.innerWidth, window.innerHeight);
threeAudioVisualization.mount(document.body);
threeAudioVisualization.start();
