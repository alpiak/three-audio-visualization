/**
 * Created by qhyang on 2018/1/12.
 */

import * as THREE from 'three';
import Physijs from './vendors/physijs/physi';

import { generateTile } from './utils';

Physijs.scripts.worker = require('./vendors/physijs/physijs_worker.js');
Physijs.scripts.ammo = require('ammo.js');

export default class ThreeAudioVisualization {
    _scene;
    _camera;
    _renderer;
    _active;
    _tiles = [
                          null, null,
                          null, null, null,
                          null,       null,
                          null,
              null, null, null,
        null, null, null, null,
              null, null
    ];

    init(width, height) {
        this._scene = new Physijs.Scene();
        this._camera = new THREE.PerspectiveCamera(45, width / height, .1, 1000);
        this._renderer = new THREE.WebGLRenderer();

        this._renderer.setSize(width, height);
        this._renderer.setClearColor(0x000000);

        // TODO: remove later
        this._scene.add(new THREE.AxesHelper(20));

        const ambientLight = new THREE.AmbientLight(0xdddddd);
        const spotLight = new THREE.SpotLight(0x999999);

        spotLight.position.set(0, 500, 500);

        this._scene.add(ambientLight);
        this._scene.add(spotLight);

        this._camera.position.set(0, 0, 500);
        this._camera.lookAt(this._scene.position);

        const tilePositions = [
                                                                 [12, 84, 0], [36, 84, 0],
                                                                 [12, 60, 0], [36, 60, 0], [60, 60, 0],
                                                                 [12, 36, 0],              [60, 36, 0],
                                                                 [12, 12, 0],
                                [-36, -12, 0],   [-12, -12, 0],  [12, -12, 0],
                [-60, -36, 0],  [-36, -36, 0],   [-12, -36, 0],  [12, -36, 0],
                                [-36, -60, 0],   [-12, -60, 0]
            ];

        tilePositions.forEach(position => {
            const tile = generateTile();
            tile.position.set(...position);
            this._scene.add(tile);
        });
    }

    mount(root) {
        root.appendChild(this._renderer.domElement);
    }

    start() {
        this._active = true;

        const render = () => {
            if (this._active) {
                requestAnimationFrame(render);
            }

            this._renderer.render(this._scene, this._camera);
            this._scene.simulate();
        };

        requestAnimationFrame(render);
    }

}