/**
 * Created by qhyang on 2018/1/12.
 */

import * as THREE from 'three';
import Physijs from './vendors/physijs/physi';
import { createjs } from './vendors/createjs/tweenjs';
import ColorPlugin from './vendors/createjs/ColorPlugin';

import { generateTile, glow, getLayout } from './utils';

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
        tiles0: [],
        tiles1: [],
        tiles2: [],
        spotLight: null
    };
    _color;

    init(width, height, { layout = 'musicNote', primaryColor = '#2eade8', accentColor, accentIndices } = {}) {
        this._scene = new Physijs.Scene();
        // this._scene.setGravity(new THREE.Vector3( 0, 0, 0 ));
        this._camera = new THREE.PerspectiveCamera(45, width / height, .1, 1000);
        this._renderer = new THREE.WebGLRenderer({ alpha: true });

        this._renderer.setSize(width, height);
        this._renderer.setClearAlpha(0);

        // TODO: remove later
        this._scene.add(new THREE.AxesHelper(20));

        this._spotLight = new THREE.SpotLight(0x999999);
        this._spotLight.position.set(0, 200, 100);
        this._scene.add(this._spotLight);

        this._camera.position.set(0, 0, 500);
        this._camera.lookAt(this._scene.position);

        let tilePositions;

        if (typeof layout === 'string') {
            tilePositions = getLayout(layout);
        } else if (Object.prototype.toString.call(layout) == '[object Array]') {
            tilePositions = layout;
        } else {
            tilePositions = getLayout('musicNote');
        }

        tilePositions.forEach((position, index) => {
            let color = new THREE.Color(primaryColor),
                accent = false;

            if (accentColor) {
                accentIndices.forEach(accentIndex => {
                    if (accentIndex === index) {
                        color = new THREE.Color(accentColor);
                        accent = true;
                    }
                })
            }

            const tile = generateTile({ color });

            tile.position.set(...position);
            glow(tile);
            this._scene.add(tile);
            this._tiles[index] = {
                color: '#' + color.getHex().toString(16),
                object: tile,
                accent,

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

        if (!this._tween.tiles0[index]) {
            this._tween.tiles0[index] = createjs.Tween.get({
                rotationX: tile.rotation.x,
                rotationY: tile.rotation.y,
                rotationZ: tile.rotation.z,
                color: tileItem.color,
            });

            this._tween.tiles0[index].addEventListener('change', () => {
                tile.rotation.set(tween.target.rotationX, tween.target.rotationY, tween.target.rotationZ);
                tile.material.color.set(new THREE.Color(tween.target.color.replace(/-[0-9]+,/g, '0,')));
            });
        }

        const tween = this._tween.tiles0[index];

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
     * @param {String} [options.color]
     * @param {String} [options.direction=vertical] - Value from ['vertical', 'horizontal']
     */
    rollOverTile(index, { color, direction = 'vertical' } = {}) {
        if (color && !/^#/.test(color)) {
            color = '#' + new THREE.Color(color).getHex().toString(16);
        }

        const tileItem = this._tiles[index],
            tile = tileItem.object;

        if (!this._tween.tiles0[index]) {
            this._tween.tiles0[index] = createjs.Tween.get({
                rotationX: tile.rotation.x,
                rotationY: tile.rotation.y,
                rotationZ: tile.rotation.z,
                color: tileItem.color,
            });

            this._tween.tiles0[index].addEventListener('change', () => {
                tile.rotation.set(tween.target.rotationX, tween.target.rotationY, tween.target.rotationZ);
                tile.material.color.set(new THREE.Color(tween.target.color.replace(/-[0-9]+,/g, '0,')));
            });
        }

        const tween = this._tween.tiles0[index];

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

    floatTile(index, offset, { color } = {}, callback) {
        if (color && !/^#/.test(color)) {
            color = '#' + new THREE.Color(color).getHex().toString(16);
        }

        const tileItem = this._tiles[index],
            tile = tileItem.object;

        if (!this._tween.tiles1[index]) {
            this._tween.tiles1[index] = createjs.Tween.get({
                color: tileItem.color,
                floatOffset: 0
            });

            this._tween.tiles1[index].addEventListener('change', () => {
                const target = this._tween.tiles1[index].target,
                    target1 = this._tween.tiles2[index].target;

                tile.position.set(target1.x, target1.y, target1.z + target.floatOffset);
                tile.material.color.set(new THREE.Color(target.color.replace(/-[0-9]+,/g, '0,')));
                tile.material.opacity = target1.opacity * .8;
                tile.children[0].material.opacity = target1.opacity * .2;

                if (target1.opacity < .5) {
                    tile.children[1].visible = false;
                }
            });
        }

        if (!this._tween.tiles2[index]) {
            this._tween.tiles2[index] = createjs.Tween.get({
                x: tile.position.x,
                y: tile.position.y,
                z: tile.position.z,
                opacity: 1
            });

            this._tween.tiles2[index].addEventListener('change', () => {
                const target = this._tween.tiles1[index].target,
                    target1 = this._tween.tiles2[index].target;

                tile.position.set(target1.x, target1.y, target1.z + target.floatOffset);
                tile.material.color.set(new THREE.Color(target.color.replace(/-[0-9]+,/g, '0,')));
                tile.material.opacity = target1.opacity * .8;
                tile.children[0].material.opacity = target1.opacity * .2;

                if (target1.opacity < .5) {
                    tile.children[1].visible = false;
                }
            });
        }

        const tween = this._tween.tiles1[index];

        tween
            .wait(3000 * Math.random())
            .to({
                floatOffset: offset,
                color: color || this._tiles[index].color
            }, 5000 + 5000 * Math.random(), createjs.Ease.quadInOut)
            .wait(3000 * Math.random())
            .to({
                floatOffset: 0,
                color: this._tiles[index].color
            }, 5000 + 5000 * Math.random(), createjs.Ease.quadInOut)
            .call(() => {
                if (typeof callback === 'function') {
                    callback();
                }
            })
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

    startFloatingTiles(offset, { color } = {}) {
        this._tiles.forEach((tileItem, index) => {
            tileItem.floating = true;

            const animate = () => {
                this.floatTile(index, offset, { color }, () => {
                    if (tileItem.floating === true) {
                        animate();
                    }
                });
            };

            animate();
        });
    }

    stopFloatingTiles() {
        this._tiles.forEach(tileItem => {
           tileItem.floating = false;
        });
    }

    /**
     * Switch to another layout of tiles with animation.
     * @param {string|Array[]} [layout=musicNote] - The layout of tiles, can be a string for a build-in layout or an array of arrays for a custom layout.
     */
    switchLayout(layout = 'musicNote') {
        let tilePositions;

        if (typeof layout === 'string') {
            tilePositions = getLayout(layout);
        } else if (Object.prototype.toString.call(layout) == '[object Array]') {
            tilePositions = layout;
        } else {
            tilePositions = getLayout('musicNote');
        }

        const fadeOutPosition = [0, 0, 300],
            lengthDiff = tilePositions.length - this._tiles.length;

        if (lengthDiff > 0) {
            for (let i = 0; i < lengthDiff; i++) {
                const color = this._tiles.filter(tile => !tile.accent)[0].color,
                    tile = generateTile({ color });

                tile.position.set(...fadeOutPosition);
                tile.material.opacity = 0;
                glow(tile);
                this._scene.add(tile);
                this._tiles.push({
                    color,
                    object: tile,
                    accent: false,

                    // Adjust the rotation direction, value from [-1, 1].
                    rotationYAdjust: 1,
                    rotationZAdjust: 1
                });
            }
        }

        this._tiles.forEach((tileItem, index) => {
            const tile = tileItem.object;

            if (!this._tween.tiles1[index]) {
                this._tween.tiles1[index] = createjs.Tween.get({
                    color: tileItem.color,
                    floatOffset: 0
                });

                this._tween.tiles1[index].addEventListener('change', () => {
                    const target = this._tween.tiles1[index].target,
                        target1 = this._tween.tiles2[index].target;

                    tile.position.set(target1.x, target1.y, target1.z + target.floatOffset);
                    tile.material.color.set(new THREE.Color(target.color.replace(/-[0-9]+,/g, '0,')));
                    tile.material.opacity = target1.opacity * .8;
                    tile.children[0].material.opacity = target1.opacity * .2;

                    if (target1.opacity < .5) {
                        tile.children[1].visible = false;
                    }
                });
            }

            if (!this._tween.tiles2[index]) {
                this._tween.tiles2[index] = createjs.Tween.get({
                    x: tile.position.x,
                    y: tile.position.y,
                    z: tile.position.z,
                    opacity: 1
                });

                this._tween.tiles2[index].addEventListener('change', () => {
                    const target = this._tween.tiles1[index].target,
                        target1 = this._tween.tiles2[index].target;

                    tile.position.set(target1.x, target1.y, target1.z + target.floatOffset);
                    tile.material.color.set(new THREE.Color(target.color.replace(/-[0-9]+,/g, '0,')));
                    tile.material.opacity = target1.opacity * .8;
                    tile.children[0].material.opacity = target1.opacity * .2;

                    if (target1.opacity < .5) {
                        tile.children[1].visible = false;
                    }
                });
            }

            const tween = this._tween.tiles2[index];

            if (index < tilePositions.length) {
                tween
                    .to({
                        x: tilePositions[index][0],
                        y: tilePositions[index][1],
                        z: tilePositions[index][2],
                        opacity: 1
                    }, 1000, createjs.Ease.circInOut)
                    .setPaused(false);
            } else {
                tween
                    .to({
                        x: fadeOutPosition[0],
                        y: fadeOutPosition[1],
                        z: fadeOutPosition[2],
                        opacity: 0
                    }, 1000, createjs.Ease.circInOut)
                    .setPaused(false);
            }
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