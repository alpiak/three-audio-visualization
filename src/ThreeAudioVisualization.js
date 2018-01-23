/**
 * Created by qhyang on 2018/1/12.
 */

import * as THREE from 'three';
import Physijs from './vendors/physijs/physi';
import { createjs } from './vendors/createjs/tweenjs';
import ColorPlugin from './vendors/createjs/ColorPlugin';

import { generateTile, glow } from './utils';
import { musicNote } from './layouts';

Physijs.scripts.worker = require('./vendors/physijs/physijs_worker.js');
Physijs.scripts.ammo = require('ammo.js');

ColorPlugin.install(createjs);

export default class ThreeAudioVisualization {
    _scene;
    _camera;
    _renderer;
    _spotLight;
    _active;
    _simulating = false;
    _tiles = [];
    _tween = {
        tiles: [],
        spotLight: null
    };
    _color;

    init(width, height, { layout, color = '#2eade8' } = { color: '#2eade8' }) {
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
            const _color = new THREE.Color(color),
                tile = generateTile({ color: _color });

            tile.position.set(...position);
            glow(tile);
            this._scene.add(tile);
            this._tiles[index] = {
                color: '#' + _color.getHex().toString(16),
                object: tile,

                // Adjust the rotation direction, value from [-1, 1].
                rotationYAdjust: 1,
                rotationZAdjust: 1
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

        const tileItem = this._tiles[index],
            tile = tileItem.object;

        if (!this._tween.tiles[index]) {
            this._tween.tiles[index] = createjs.Tween.get({
                rotationX: tile.rotation.x,
                rotationY: tile.rotation.y,
                rotationZ: tile.rotation.z,
                color: tileItem.color
            }, { override: true });

            this._tween.tiles[index].addEventListener('change', () => {
                tile.rotation.set(tween.target.rotationX, tween.target.rotationY, tween.target.rotationZ);
                tile.material.color.set(new THREE.Color(tween.target.color.replace(/-[0-9]+,/g, '0,')));
            });
        }

        const tween = this._tween.tiles[index];

        if (!tileItem.rotationX) {
            tileItem.rotationX = tile.rotation.x;
        }

        if (!tileItem.rotationY) {
            tileItem.rotationY = tile.rotation.y;
        }

        if (!tileItem.rotationZ) {
            tileItem.rotationZ = tile.rotation.z;
        }

        tween
            .to({
                rotationX: tileItem.rotationX + rotationX,
                rotationY: tileItem.rotationY + rotationY * tileItem.rotationYAdjust,
                rotationZ: tileItem.rotationZ + rotationZ,
                color: color || this._tiles[index].color
            }, 300, createjs.Ease.circInOut)
            .to({
                rotationX: tileItem.rotationX,
                rotationY: tileItem.rotationY,
                rotationZ: tileItem.rotationZ,
                color: this._tiles[index].color
            }, 3600, createjs.Ease.getElasticOut(1.8, .2))
            .call(() => {
                tile.updateMatrix();
            })
            .setPaused(false);
    }

    /**
     * Roll over a tile.
     * @param {Number} index
     * @param {Object] [options] - Options.
     * @param {String} options.color
     * @param {String} options.direction=vertical, value from ['vertical', 'horizontal']
     */
    rollOverTile(index, { color, direction = 'vertical' } = {}) {
        if (color && !/^#/.test(color)) {
            color = '#' + new THREE.Color(color).getHex().toString(16);
        }

        const tileItem = this._tiles[index],
            tile = tileItem.object;

        if (!this._tween.tiles[index]) {
            this._tween.tiles[index] = createjs.Tween.get({
                rotationX: tile.rotation.x,
                rotationY: tile.rotation.y,
                rotationZ: tile.rotation.z,
                color: tileItem.color
            }, { override: true });

            this._tween.tiles[index].addEventListener('change', () => {
                tile.rotation.set(tween.target.rotationX, tween.target.rotationY, tween.target.rotationZ);
                tile.material.color.set(new THREE.Color(tween.target.color.replace(/-[0-9]+,/g, '0,')));
            });
        }

        const tween = this._tween.tiles[index];

        if (!tileItem.rotationX) {
            tileItem.rotationX = tile.rotation.x;
        }

        if (!tileItem.rotationY) {
            tileItem.rotationY = tile.rotation.y;
        }

        if (!tileItem.rotationZ) {
            tileItem.rotationZ = tile.rotation.z;
        }

        let target = {
            color: color || this._tiles[index].color
        };

        switch (direction) {
            case 'vertical':
                tileItem.rotationX -= Math.PI;
                target.rotationX = tileItem.rotationX;
                tileItem.rotationYAdjust *= -1;
                tileItem.rotationZAdjust *= -1;
                break;
            case 'horizontal':
                tileItem.rotationY += Math.PI * tileItem.rotationYAdjust;
                target.rotationY = tileItem.rotationY;
                tileItem.rotationZAdjust *= -1;
                break;
            case 'cross':
                tileItem.rotationY += Math.PI * tileItem.rotationYAdjust;
                tileItem.rotationZ -= Math.PI * tileItem.rotationZAdjust;
                target.rotationY = tileItem.rotationY;
                target.rotationZ = tileItem.rotationZ;
                tileItem.rotationZAdjust *= -1;
                break;
        }

        tween.to(target, 1000, createjs.Ease.circInOut)
            .setPaused(false);
    }

    waveTiles({ x = -100, y = -100, z = 0, speed = .1, power = 1, type = 'shake', color } = {}) {
        this._tiles.forEach((_tile, index) => {
            const tile = _tile.object,
                waveSourcePosition = new THREE.Vector3(x, y, z),
                distanceX = tile.position.x - x,
                distanceY = tile.position.y - y,
                distanceZ = tile.position.z - z;

            const rotation = [];

            rotation[0] = -distanceX && Math.PI / 2 * power / -distanceX;
            rotation[1] = distanceY && Math.PI / 2 * power / distanceY;
            rotation[2] = distanceZ && Math.PI / 2 * power / distanceZ;

            rotation.forEach(component => {
                if (component > Math.PI / 2) {
                    component = Math.Pi / 2;
                }
            });

            setTimeout(() => {
                switch (type) {
                    case 'shake':
                        this.shakeTile(index, {
                            rotationX: rotation[0],
                            rotationY: rotation[1],
                            rotationZ: rotation[2],
                            color
                        });
                        break;
                    case 'rollover':
                        const direction = (() => {
                            if (x === y) {
                                return 'cross';
                            }

                            return Math.abs(distanceX) < Math.abs(distanceY) ? 'vertical' : 'horizontal';
                        })();

                        this.rollOverTile(index, {
                            direction,
                            color
                        });
                        break;
                    default:
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

    moveLight({ x, y, z, duration } = {}) {
        const spotLight = this._spotLight;

        if (!this._tween.spotLight) {
            this._tween.spotLight = {
                x: spotLight.position.x,
                y: spotLight.position.y,
                z: spotLight.position.z
            }
        }

        const tween = this._tween.spotLight;

        createjs.Tween.get(tween, { override: true })
            .to({
                x: x || spotLight.position.x,
                y: y || spotLight.position.y,
                z: z || spotLight.position.z
            }, duration || 10000, createjs.Ease.circInOut)
            .addEventListener('change', event => {
                const tween = event.target.target;

                spotLight.position.set(tween.x, tween.y, tween.z);
            });
    }
}