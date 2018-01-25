/**
 * Created by qhyang on 2018/1/12.
 */

import * as THREE from 'three';
import Physijs from './vendors/physijs/physi';

import { generateTile, glow } from './utils';
import { musicNote } from './layouts';

Physijs.scripts.worker = require('./vendors/physijs/physijs_worker.js');
Physijs.scripts.ammo = require('ammo.js');

export default class ThreeAudioVisualization {
    _scene;
    _camera;
    _renderer;
    _active;
    _simulating = false;
    _tiles = [];

    /**
     * Init the scene.
     * @param {Number} width
     * @param {Number} height
     * @param {Object] [options] - Options.
     * @param {String|Array[]} options.layout
     * @param {String} options.primaryColor
     * @param {String} options.accentColor
     * @param {Number[]} options.accentIndices
     */
    init(width, height, { layout = 'musicNote', primaryColor = '#2eade8', accentColor, accentIndices } = { primaryColor: '#2eade8'}) {
        this._scene = new Physijs.Scene();
        // this._scene.setGravity(new THREE.Vector3( 0, 0, 0 ));
        this._camera = new THREE.PerspectiveCamera(45, width / height, .1, 1000);
        this._renderer = new THREE.WebGLRenderer({ alpha: true });

        this._renderer.setSize(width, height);
        this._renderer.setClearAlpha(0);

        // TODO: remove later
        this._scene.add(new THREE.AxesHelper(20));

        const ambientLight = new THREE.AmbientLight(0xdddddd);
        this._spotLight = new THREE.SpotLight(0x999999);

        this._spotLight.position.set(0, 200, 100);

        this._scene.add(ambientLight);
        this._scene.add(this._spotLight);

        this._camera.position.set(0, 0, 500);
        this._camera.lookAt(this._scene.position);

        let tilePositions;

        if (layout === 'musicNote') {
            tilePositions = musicNote;
        } else if (Object.prototype.toString.call(layout) == '[object Array]') {
            tilePositions = layout;
        } else {
            tilePositions = musicNote;
        }

        tilePositions.forEach((position, index) => {
            let _color = new THREE.Color(primaryColor);

            if (accentColor) {
                accentIndices.forEach(accentIndex => {
                    if (accentIndex === index) {
                        _color = new THREE.Color(accentColor);
                    }
                })
            }

            const tile = generateTile({ color: _color });

            tile.position.set(...position);
            glow(tile);
            this._scene.add(tile);
            this._tiles[index] = {
                color: '#' + _color.getHex().toString(16),
                object: tile
            };
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

            if (this._simulating) {
                this._scene.simulate();
            }
        };

        requestAnimationFrame(render);
    }

}