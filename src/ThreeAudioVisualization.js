/**
 * Created by qhyang on 2018/1/12.
 */

import * as THREE from 'three';
import Physijs from './vendors/physijs/physi';
import { createjs } from './vendors/createjs/tweenjs';
import ColorPlugin from './vendors/createjs/ColorPlugin';

import { generateTile, glow } from './utils';

Physijs.scripts.worker = require('./vendors/physijs/physijs_worker.js');
Physijs.scripts.ammo = require('ammo.js');

ColorPlugin.install(createjs);

export default class ThreeAudioVisualization {
    _scene;
    _camera;
    _renderer;
    _active;
    _simulating = false;
    _tiles = [
                          null, null,
                          null, null, null,
                          null,       null,
                          null,
              null, null, null,
        null, null, null, null,
              null, null
    ];
    _tween = {
        tiles: []
    };
    _color;

    init(width, height) {
        this._scene = new Physijs.Scene();
        // this._scene.setGravity(new THREE.Vector3( 0, 0, 0 ));
        this._camera = new THREE.PerspectiveCamera(45, width / height, .1, 1000);
        this._renderer = new THREE.WebGLRenderer();

        this._renderer.setSize(width, height);
        this._renderer.setClearColor(0x000000);

        // TODO: remove later
        this._scene.add(new THREE.AxesHelper(20));

        const ambientLight = new THREE.AmbientLight(0xdddddd);
        const spotLight = new THREE.SpotLight(0x999999);

        spotLight.position.set(0, 200, 100);

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

        tilePositions.forEach((position, index) => {
            const tile = generateTile({ color: new THREE.Color('#2eade8') });

            tile.position.set(...position);
            glow(tile);
            this._scene.add(tile);
            this._tiles[index] = {
                color: new THREE.Color('#2eade8'),
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

    shakeTile(index, { rotationX = -Math.PI / 5, rotationY = Math.PI / 5, rotationZ = 0, color } = {}) {
        if (color && !/^#/.test(color)) {
            color = '#' + new THREE.Color(color).getHex().toString(16);
        }

        const tile = this._tiles[index].object;

        if (!this._tween.tiles[index]) {
            this._tween.tiles[index] = {
                rotationX: tile.rotation.x,
                rotationY: tile.rotation.y,
                rotationZ: tile.rotation.z,
                color: '#' + this._tiles[index].color.getHex().toString(16)
            }
        }

        let tween = this._tween.tiles[index];

        createjs.Tween.get(tween, { override: true })
            .to({
                rotationX: rotationX,
                rotationY: rotationY,
                rotationZ: rotationZ,
                color: color || ('#' + this._tiles[index].color.getHex().toString(16))
            }, 300, createjs.Ease.circOut)
            .to({
                rotationX: 0,
                rotationY: 0,
                rotationZ: 0,
                color: '#' + this._tiles[index].color.getHex().toString(16)
            }, 3600, createjs.Ease.getElasticOut(1.8, .2))
            .addEventListener('change', event => {
                const tween = event.target.target;

                tile.rotation.set(tween.rotationX, tween.rotationY, tween.rotationZ);
                tile.material.color.set(new THREE.Color(tween.color));
            });
    }

    wave({ x = -100, y = -100, z = 0, speed = .1, power = 1, type = 'shake', color } = {}) {
        this._tiles.forEach((_tile, index) => {
            const tile = _tile,
                waveSourcePosition = new THREE.Vector3(x, y, z);

            const rotation = [];

            rotation[0] = x - tile.position.x && Math.PI / 2 * power / (x - tile.position.x);
            rotation[1] = tile.position.y - y && Math.PI / 2 * power / (tile.position.y - y);
            rotation[2] = tile.position.z - z && Math.PI / 2 * power / (tile.position.z - z);

            rotation.forEach(component => {
                if (component > Math.PI / 2) {
                    component = Math.Pi / 2;
                }
            });

            setTimeout(() => {
                if (type === 'shake') {
                    this.shakeTile(index, {
                        rotationX: rotation[0],
                        rotationY: rotation[1],
                        rotationZ: rotation[2],
                        color
                    });
                }
            }, tile.position.distanceTo(waveSourcePosition) / speed);
        });
    }
}