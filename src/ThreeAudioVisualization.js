/**
 * Created by qhyang on 2018/1/12.
 */

import * as THREE from 'three';
import Physijs from './vendors/physijs/physi';
import { createjs } from './vendors/createjs/tweenjs';
import ColorPlugin from './vendors/createjs/ColorPlugin';

import { generateTile, generatePlane, glow, getLayout } from './utils';
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
    _ground;
    _tween = {
        tiles0: [],
        tiles1: [],
        tiles2: [],
        spotLight: null,
        camera: null,
        ground: null
    };
    _color;

        /**
         * Init the scene.
         * @param {number} width
         * @param {number} height
         * @param {Object] [options] - Options.
         * @param {string|Array[]} options.layout
         * @param {string} options.primaryColor
         * @param {string} options.accentColor
         * @param {number[]} options.accentIndices
         */
        init(width, height, { layout = 'musicNote', primaryColor = '#2eade8', accentColor, accentIndices }) {
        this._scene = new Physijs.Scene();
        this._scene.setGravity(new THREE.Vector3( 0, -600, 0 ));
        this._camera = new THREE.PerspectiveCamera(45, width / height, .1, 1000);
        this._renderer = new THREE.WebGLRenderer({ alpha: true });

        this._renderer.setSize(width, height);
        this._renderer.setClearAlpha(0);
        this._renderer.shadowMapEnabled = true;
        this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // TODO: remove later
        this._scene.add(new THREE.AxesHelper(20));

        this._spotLight = new THREE.SpotLight(0x999999);
        this._spotLight.position.set(0, 200, 100);
        this._spotLight.castShadow = true;

        this._tween.spotLight = createjs.Tween.get({
            x: this._spotLight.position.x,
            y: this._spotLight.position.y,
            z: this._spotLight.position.z,
            intensity: this._spotLight.intensity
        }, { override: true });

        this._tween.spotLight.addEventListener('change', (event) => {
            const tween = event.target.target;

            this._spotLight.position.set(tween.x, tween.y, tween.z);
            this._spotLight.intensity = tween.intensity;
        });

        this._scene.add(this._spotLight);

        this._camera.position.set(0, 0, 500);
        this._camera.lookAt(this._scene.position);
        this._tween.camera = createjs.Tween.get({
            lookAtX: 0,
            lookAtY: 0,
            lookAtZ: 0
        }, { override: true });

        this._tween.camera.addEventListener('change', (event) => {
            const tween = event.target.target;

            this._camera.lookAt(new THREE.Vector3(tween.lookAtX, tween.lookAtY, tween.lookAt));
        });

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
            tile.castShadow = true;
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

        this._ground = generatePlane({
            width: 260,
            height: 260,
            opacity: 0,
            texture: new THREE.TextureLoader().load(require('./ground.png'))
        });

        const roof = generatePlane({
            width: 200,
            height: 200
        });

        roof.position.set(0, 0, 600);
        roof.rotation.set(Math.PI, 0, 0);
        roof.visible = false;

        const leftWall = generatePlane({
            width: 600,
            height: 200,
            restitution: 1
        });

        leftWall.position.set(-100, 0, 100);
        leftWall.rotation.set(0, Math.PI / 2, 0);
        leftWall.visible = false;

        const rightWall = generatePlane({
            width: 600,
            height: 200,
            restitution: 1
        });

        rightWall.position.set(100, 0, 100);
        rightWall.rotation.set(0, Math.PI / -2, 0);
        rightWall.visible = false;

        const backWall = generatePlane({
            width: 200,
            height: 600,
            restitution: 1
        });

        backWall.position.set(0, 100, 100);
        backWall.rotation.set(Math.PI / 2, 0, 0);
        backWall.visible = false;

        const frontWall = generatePlane({
            width: 200,
            height: 600,
            restitution: 1
        });

        frontWall.position.set(0, -100, 100);
        frontWall.rotation.set(Math.PI / -2, 0, 0);
        frontWall.visible = false;

        this._ground.add(roof);
        this._ground.add(leftWall);
        this._ground.add(rightWall);
        this._ground.add(backWall);
        this._ground.add(frontWall);
        this._ground.position.set(0, -250, 0);
        this._ground.rotation.set(Math.PI / -2, 0, 0);
        this._ground.receiveShadow = true;

        this._tween.ground = createjs.Tween.get({
            opacity: 0
        }, { override: true });

        this._tween.ground.addEventListener('change', (event) => {
            const tween = event.target.target;

            this._ground.material.opacity = tween.opacity;
        });

        this._scene.add(this._ground);
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

        tween.to(target, 500, createjs.Ease.quadInOut)
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

    waveTiles({ x = -100, y = -100, z = 0, speed = .1, power = 1, type = 'shake', type: { animationType, direction }, color } = {}) {
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
                component = Math.min(component, Math.Pi / 2);
            });

            setTimeout(() => {
                let _type;

                if (animationType) {
                    _type = animationType;
                } else {
                    _type = type;
                }

                switch (_type) {
                    case 'shake':
                        this.shakeTile(index, {
                            rotationX: rotation[0],
                            rotationY: rotation[1],
                            rotationZ: rotation[2],
                            color
                        });
                        break;
                    case 'rollover':
                        if (!direction) {
                            direction = (() => {
                                if (x === y) {
                                    return 'cross';
                                }

                                return Math.abs(distanceX) < Math.abs(distanceY) ? 'vertical' : 'horizontal';
                            })();
                        }

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

        this._tween.spotLight
            .to({
                x: x || spotLight.position.x,
                y: y || spotLight.position.y,
                z: z || spotLight.position.z
            }, duration || 10000, createjs.Ease.circInOut)
            .setPaused(false);
    }

    switchMode(mode) {
        const vector = new THREE.Vector3;

        switch (mode) {
            case 'physics':
                vector.set(0, 0, 0);

                this._tiles.forEach(({ object }) => {
                    object.__dirtyPosition = true;
                    object.__dirtyRotation = true;
                    object.setAngularFactor(vector);
                    object.setAngularVelocity(vector);
                    object.setLinearFactor(vector);
                    object.setLinearVelocity(vector);
                });

                this._simulating = true;
                vector.set(1, 1, 1);

                const randomTile = this._tiles[Math.floor(this._tiles.length * Math.random())];

                this._tiles.forEach(({ object }) => {
                    setTimeout(() => {
                        object.setAngularFactor(vector);
                        object.setLinearFactor(vector);
                    }, object.position.distanceTo(randomTile.object.position) * 10);
                });

                setTimeout(() => {
                    this._tween.camera
                        .to({
                            lookAtX: this._ground.position.x,
                            lookAtY: this._ground.position.y + 80,
                            lookAtZ: this._ground.position.z
                        }, 2800, createjs.Ease.quartInOut)
                        .setPaused(false);

                    this._tween.ground
                        .to({
                            opacity: 1
                        }, 2800, createjs.Ease.quartInOut)
                        .setPaused(false);

                    this._tween.spotLight
                        .to({
                            x: 0,
                            y: 0,
                            z: 0,
                            intensity: 2
                        }, 2800, createjs.Ease.quartInOut)
                        .setPaused(false);

                    this._spotLight.target = this._ground;
                }, 900);

                break;

            case 'basic':
                this._simulating = false;

                break;
        }
    }

    applyForces(...forces) {
        const _vec3 = new THREE.Vector3;

        this._tiles.forEach(({ object }) => {
            const groupSize = 100 / forces.length; // The radius range of a ring area.

            _vec3.set(object.position.x, 0, object.position.z);

            const distance = _vec3.distanceTo(this._scene.position); // Distance to the center.

            for (let i = 0; i < forces.length; i++) {
                if (distance < i * groupSize) {
                    continue;
                }

                if (distance < (i + 1) * groupSize || i === forces.length - 1) {
                    _vec3.set(0, forces[i], 0);

                    if (object.position.y + object.geometry.boundingBox.min.y < -249) {
                        object.applyCentralImpulse(_vec3);
                    }
                    break;
                }
            }
        });
    }
}