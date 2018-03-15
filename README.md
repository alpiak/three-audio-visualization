# three-audio-visualization

A three.js application with customizable animation and audio visualization feature

## Install

    npm install three-audio-visualization

## Usage

    import ThreeAudioVisualization from 'three-audio-visualization';

    const threeAudioVisualization = new ThreeAudioVisualization;

    threeAudioVisualization.init(window.innerWidth, window.innerHeight, {
        accentColor: '#fff',
        accentIndices: [8]
    });

    threeAudioVisualization.mount(document.body);
    threeAudioVisualization.start();
