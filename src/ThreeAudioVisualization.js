/**
 * Created by qhyang on 2018/1/12.
 */

import { WebGLRenderer, Color, Vector2, Vector3, TextureLoader, SpotLight, PCFSoftShadowMap, AxesHelper, SpotLightHelper, PerspectiveCamera } from 'three';
import Physijs from './vendors/physijs/physi';
import { createjs } from './vendors/createjs/tweenjs';
import ColorPlugin from './vendors/createjs/ColorPlugin';

import { generateTile, generatePlane, glow, getLayout } from './utils';
import { musicNote } from './layouts';

Physijs.scripts.worker = require('./vendors/physijs/physijs_worker.js');
Physijs.scripts.ammo = require('ammo.js');

ColorPlugin.install(createjs);

let _onMouseMove;

export default class ThreeAudioVisualization {
    _scene;
    _camera;
    _renderer;
    _spotLight;
    _active;
    _simulating = false;
    _tiles = [];
    _ground;
    _tweens = {
        tiles0: [],
        tiles1: [],
        tiles2: [],
        spotLight: null,
        camera0: null,
        camera1: null,
        ground: null,
        domElement: null
    };
    _color;

    /**
     * Init the scene.
     * @param {number} width
     * @param {number} height
     * @param {Object} [options] - Options.
     * @param {string|Array[]} options.layout
     * @param {string} options.color
     */
    init(width, height, { layout = 'musicNote', color = '#4ccfff' } = {}) {
        this._scene = new Physijs.Scene();
        this._scene.setGravity(new Vector3( 0, -600, 0 ));
        this._camera = new PerspectiveCamera(45, width / height, .1, 1000);
        this._renderer = new WebGLRenderer({ alpha: true });

        this._renderer.setSize(width, height);
        this._renderer.setClearAlpha(0);
        this._renderer.shadowMapEnabled = true;
        this._renderer.shadowMap.type = PCFSoftShadowMap;

        // TODO: remove later
        this._scene.add(new AxesHelper(20));

        this._spotLight = new SpotLight(0x999999);
        this._spotLight.position.set(0, 200, 100);
        this._spotLight.target = this._scene;
        this._spotLight.castShadow = true;
        this._tweens.spotLight = this._getSpotLightTween();
        this._scene.add(this._spotLight);

        // TODO: remove later
        this._scene.add(new SpotLightHelper(this._spotLight));

        this._camera.position.set(0, 0, 650);
        this._tweens.camera0 = this._getCameraTween0();
        this._tweens.camera1 = this._getCameraTween1();

        const cameraTween = this._tweens.camera1.target;

        this._camera.lookAt(cameraTween.lookAtX, cameraTween.lookAtY, cameraTween.lookAtZ);

        let tilesData;

        this._currentLayout = layout;

        if (typeof layout === 'string') {
            tilesData = getLayout(layout);
        } else if (Object.prototype.toString.call(layout) == '[object Array]') {
            tilesData = layout;
        } else {
            tilesData = getLayout('musicNote');
        }

        tilesData.forEach((tileData, index) => {
            const _color = new Color(color),
                colorComponent = tileData.l * 100 + '%';

            _color.add(new Color(`rgb(${colorComponent}, ${colorComponent}, ${colorComponent})`));

            const tile = generateTile({ color: _color });

            tile.position.set(...tileData.coords);
            // glow(tile);
            tile.castShadow = true;
            this._scene.add(tile);
            this._tiles[index] = {
                color: '#' + new Color(color).getHex().toString(16),
                lightness: tileData.l,
                object: tile,

                // Adjust the rotation direction, value from [-1, 1].
                rotationYAdjust: 1,
                rotationZAdjust: 1
            };
        });

        this._ground = generatePlane({
            width: 260,
            height: 260,
            opacity: 0,
            texture: new TextureLoader().load(require('./ground.png'))
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
        this._tweens.ground = this._getGroundTween();
        this._scene.add(this._ground);

        this._tweens.domElement = this._getDomElementTween();
    }

    mount(root) {
        this._renderer.domElement.style.display = 'none';
        this._renderer.domElement.style.opacity = '0';
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

    pause() {
        this._active = false;
        this.disableReactiveCamera();
        this.stopFloatingTiles();
    }

    shakeTile(index, { rotationX = -Math.PI / 5, rotationY = Math.PI / 5, rotationZ = 0, color } = {}) {
        if (color && !/^#/.test(color)) {
            color = '#' + new Color(color).getHex().toString(16);
        }

        const tileItem = this._tiles[index],
            tile = tileItem.object;

        if (!this._tweens.tiles0[index]) {
            this._tweens.tiles0[index] = createjs.Tween.get({
                rotationX: tile.rotation.x,
                rotationY: tile.rotation.y,
                rotationZ: tile.rotation.z,
                color: tileItem.color,
            });

            this._tweens.tiles0[index].addEventListener('change', () => {
                tile.rotation.set(tween.target.rotationX, tween.target.rotationY, tween.target.rotationZ);
                tile.material.color.set(new Color(tween.target.color.replace(/-[0-9]+,/g, '0,')));
            });
        }

        const tween = this._tweens.tiles0[index];

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
            .paused = false;
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
            color = '#' + new Color(color).getHex().toString(16);
        }

        const tileItem = this._tiles[index],
            tile = tileItem.object;

        if (!this._tweens.tiles0[index]) {
            this._tweens.tiles0[index] = createjs.Tween.get({
                rotationX: tile.rotation.x,
                rotationY: tile.rotation.y,
                rotationZ: tile.rotation.z,
                color: tileItem.color,
            });

            this._tweens.tiles0[index].addEventListener('change', () => {
                tile.rotation.set(tween.target.rotationX, tween.target.rotationY, tween.target.rotationZ);
                tile.material.color.set(new Color(tween.target.color.replace(/-[0-9]+,/g, '0,')));
            });
        }

        const tween = this._tweens.tiles0[index];

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
            .paused = false;
    }

    floatTile(index, offset, { color } = {}, callback) {
        if (color && !/^#/.test(color)) {
            color = '#' + new Color(color).getHex().toString(16);
        }

        const tileItem = this._tiles[index],
            tile = tileItem.object;

        if (!this._tweens.tiles1[index]) {
            this._tweens.tiles1[index] = createjs.Tween.get({
                color: tileItem.color,
                floatOffset: 0
            });

            this._tweens.tiles1[index].addEventListener('change', () => {
                const target = this._tweens.tiles1[index].target,
                    target1 = this._tweens.tiles2[index].target;

                tile.position.set(target1.x, target1.y, target1.z + target.floatOffset);
                tile.material.color.set(new Color(target.color.replace(/-[0-9]+,/g, '0,')));
                tile.material.opacity = target1.opacity * .8;
                tile.children[0].material.opacity = target1.opacity * .2;

                if (target1.opacity < .5) {
                    tile.children[1].visible = false;
                }
            });
        }

        if (!this._tweens.tiles2[index]) {
            this._tweens.tiles2[index] = createjs.Tween.get({
                x: tile.position.x,
                y: tile.position.y,
                z: tile.position.z,
                opacity: 1
            });

            this._tweens.tiles2[index].addEventListener('change', () => {
                const target = this._tweens.tiles1[index].target,
                    target1 = this._tweens.tiles2[index].target;

                tile.position.set(target1.x, target1.y, target1.z + target.floatOffset);
                tile.material.color.set(new Color(target.color.replace(/-[0-9]+,/g, '0,')));
                tile.material.opacity = target1.opacity * .8;
                tile.children[0].material.opacity = target1.opacity * .2;

                if (target1.opacity < .5) {
                    tile.children[1].visible = false;
                }
            });
        }

        const tween = this._tweens.tiles1[index];

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
            .paused = false;
    }

    waveTiles({ x = -100, y = -100, z = 0, speed = .1, power = 1, type = 'shake', type: { animationType, direction }, color } = {}) {
        this._tiles.forEach((_tile, index) => {
            const tile = _tile.object,
                waveSourcePosition = new Vector3(x, y, z),
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
        this._currentLayout = layout;

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
                // glow(tile);
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

            if (!this._tweens.tiles0[index]) {
                this._tweens.tiles0[index] = createjs.Tween.get({
                    rotationX: tile.rotation.x,
                    rotationY: tile.rotation.y,
                    rotationZ: tile.rotation.z,
                    color: tileItem.color
                });

                this._tweens.tiles0[index].addEventListener('change', () => {
                    const target = this._tweens.tiles0[index].target;

                    tile.rotation.set(target.rotationX, target.rotationY, target.rotationZ);
                    tile.material.color.set(new Color(target.color.replace(/-[0-9]+,/g, '0,')));
                });
            } else {
                this._tweens.tiles0[index].to({
                    rotationX: tile.rotation.x,
                    rotationY: tile.rotation.y,
                    rotationZ: tile.rotation.z,
                    color: tileItem.color
                }, 0);
            }

            if (!this._tweens.tiles1[index]) {
                this._tweens.tiles1[index] = createjs.Tween.get({
                    color: tileItem.color,
                    floatOffset: 0
                });

                this._tweens.tiles1[index].addEventListener('change', () => {
                    const target = this._tweens.tiles1[index].target,
                        target1 = this._tweens.tiles2[index].target;

                    tile.position.set(target1.x, target1.y, target1.z + target.floatOffset);
                    tile.material.color.set(new Color(target.color.replace(/-[0-9]+,/g, '0,')));
                    tile.material.opacity = target1.opacity * .8;
                    tile.children[0].material.opacity = target1.opacity * .2;

                    if (target1.opacity < .5) {
                        tile.children[1].visible = false;
                    }
                });
            }

            if (!this._tweens.tiles2[index]) {
                this._tweens.tiles2[index] = createjs.Tween.get({
                    x: tile.position.x,
                    y: tile.position.y,
                    z: tile.position.z,
                    opacity: 1
                });

                this._tweens.tiles2[index].addEventListener('change', () => {
                    const target = this._tweens.tiles1[index].target,
                        target1 = this._tweens.tiles2[index].target;

                    tile.position.set(target1.x, target1.y, target1.z + target.floatOffset);
                    tile.material.color.set(new Color(target.color.replace(/-[0-9]+,/g, '0,')));
                    tile.material.opacity = target1.opacity * .8;
                    tile.children[0].material.opacity = target1.opacity * .2;

                    if (target1.opacity < .5) {
                        tile.children[1].visible = false;
                    }
                });
            } else {
                this._tweens.tiles2[index].to({
                    x: tile.position.x,
                    y: tile.position.y,
                    z: tile.position.z - this._tweens.tiles1[index].target.floatOffset,
                    opacity: tile.material.opacity
                }, 0);
            }

            const tween0 = this._tweens.tiles0[index];

            tween0
                .to({
                    rotationX: 0,
                    rotationY: 0,
                    rotationZ: 0
                }, 1000, createjs.Ease.circInOut)
                .paused = false;

            const tween2 = this._tweens.tiles2[index];

            if (index < tilePositions.length) {
                tween2
                    .to({
                        x: tilePositions[index][0],
                        y: tilePositions[index][1],
                        z: tilePositions[index][2],
                        opacity: 1
                    }, 1000, createjs.Ease.circInOut)
                    .paused = false;
            } else {
                tween2
                    .to({
                        x: fadeOutPosition[0],
                        y: fadeOutPosition[1],
                        z: fadeOutPosition[2],
                        opacity: 0
                    }, 1000, createjs.Ease.circInOut)
                    .paused = false;
            }
        });
    }

    moveLight({ x, y, z, duration } = {}) {
        const spotLight = this._spotLight;

        this._tweens.spotLight
            .to({
                x: x || spotLight.position.x,
                y: y || spotLight.position.y,
                z: z || spotLight.position.z
            }, duration || 10000, createjs.Ease.circInOut)
            .paused = false;
    }

    switchMode(mode) {
        const tweens = this._tweens;

        tweens.tiles0.concat(tweens.tiles1).concat(tweens.tiles2).forEach(tween => {
            createjs.Tween.removeTweens(tween.target);
        });

        createjs.Tween.removeTweens(tweens.spotLight.target);
        createjs.Tween.removeTweens(tweens.camera1.target);
        createjs.Tween.removeTweens(tweens.ground.target);
        tweens.spotLight = this._getSpotLightTween();
        tweens.camera1 = this._getCameraTween1();
        tweens.ground  = this._getGroundTween();

        const _vec3 = new Vector3;

        switch (mode) {
            case 'physics':
                this._simulating = true;

                requestAnimationFrame(() => {
                    _vec3.set(0, 0, 0);

                    this._tiles.forEach(({ object }) => {
                        object.__dirtyPosition = true;
                        object.__dirtyRotation = true;
                        object.setAngularFactor(_vec3);
                        object.setAngularVelocity(_vec3);
                        object.setLinearFactor(_vec3);
                        object.setLinearVelocity(_vec3);
                    });

                    const randomTile = this._tiles[Math.floor(this._tiles.length * Math.random())];

                    _vec3.set(1, 1, 1);

                    this._tiles.forEach(({ object }) => {
                        setTimeout(() => {
                            object.setAngularFactor(_vec3);
                            object.setLinearFactor(_vec3);
                        }, object.position.distanceTo(randomTile.object.position) * 8);
                    });
                });

                setTimeout(() => {
                    tweens.camera1
                        .to({
                            lookAtX: this._ground.position.x,
                            lookAtY: this._ground.position.y + 120,
                            lookAtZ: this._ground.position.z
                        }, 2800, createjs.Ease.quartInOut)
                        .paused = false;

                    tweens.ground
                        .to({
                            opacity: 1
                        }, 2800, createjs.Ease.quartInOut)
                        .paused = false;

                    tweens.spotLight
                        .to({
                            x: 0,
                            y: 0,
                            z: 0,
                            intensity: 2
                        }, 2800, createjs.Ease.quartInOut)
                        .paused = false;

                    this._spotLight.target = this._ground;
                }, 900);

                break;

            case 'basic':
                this._simulating = false;
                this.switchLayout(this._currentLayout);

                tweens.camera1
                    .to({
                        lookAtX: this._scene.position.x,
                        lookAtY: this._scene.position.y,
                        lookAtZ: this._scene.position.z
                    }, 1200, createjs.Ease.quartInOut)
                    .paused = false;

                tweens.ground
                    .to({
                        opacity: 0
                    }, 1200, createjs.Ease.quartInOut)
                    .paused = false;

                tweens.spotLight
                    .to({
                        x: 0,
                        y: 200,
                        z: 100,
                        intensity: 1
                    }, 1200, createjs.Ease.quartInOut)
                    .paused = false;

                this._spotLight.target = this._scene;

                break;
        }
    }

    applyForces(...forces) {
        const _vec3 = new Vector3;

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

    async enableReactiveCamera() {
        const _previousVec2 = new Vector2,
            _vec2 = new Vector2,

            _handleMouseMove = e => {
                _vec2.set(e.x, e.y);

                if (_vec2.distanceTo(_previousVec2) > 30) {
                    _previousVec2.set(e.x, e.y);

                    const ratioX = e.x / window.innerWidth,
                        ratioY = e.y / window.innerHeight,
                        radX = Math.PI / 6 * (ratioX - .5),
                        radY = Math.PI / 6 * (ratioY - .5);

                    (this._tweens.camera0 = this._getCameraTween0())
                        .to({
                            x: Math.sin(radX) * 650,
                            y: Math.sin(radY) * 650 * -1,
                            z: Math.cos(radX) * Math.cos(radY) * 650
                        }, 800, createjs.Ease.quartOut)
                        .paused = false;
                }
            },

            _handleDeviceOrientation = e => {
                _vec2.set(e.gamma, e.beta);

                if (_vec2.distanceTo(_previousVec2) > 3) {
                    _previousVec2.set(e.gamma, e.beta);

                    const radX = Math.PI / 3 * e.gamma / 180,
                        radY = (() => {
                            let _beta = e.beta - 51;

                            if (e.beta + 90 < 51) {
                                _beta = 39 + e.beta + 90;
                            } else {
                                _beta = e.beta - 51;
                            }

                            return Math.PI / 3 * _beta  / 180 * -1;
                        })();

                    (this._tweens.camera0 = this._getCameraTween0())
                        .to({
                            x: Math.sin(radX) * 650,
                            y: Math.sin(radY) * 650 * -1,
                            z: Math.cos(radX) * Math.cos(radY) * 650
                        }, 800, createjs.Ease.quartOut)
                        .paused = false;
                }
            },
            deviceOrientation = await new Promise((resolve) => {
                const _handleMouseMove = () => {
                        document.removeEventListener('mousemove', _handleMouseMove);
                        document.removeEventListener('deviceorientation', _handleDeviceOrientation);
                        resolve(false);
                    },

                    _handleDeviceOrientation = e => {
                        document.removeEventListener('mousemove', _handleMouseMove);
                        document.removeEventListener('deviceorientation', _handleDeviceOrientation);

                        if (e.alpha || e.beta || e.gamma) {
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    };
;
                document.addEventListener('mousemove', _handleMouseMove);
                document.addEventListener('deviceorientation', _handleDeviceOrientation);
            });

        if (deviceOrientation) {
            document.addEventListener('deviceorientation', _handleDeviceOrientation);
        } else {
            document.addEventListener('mousemove', _handleMouseMove);
        }
    }

    disableReactiveCamera() {
        if (_onMouseMove) {
            document.removeEventListener('mousemove', _onMouseMove);
        }
    }

    show() {
        createjs.Tween.removeTweens(this._tweens.domElement.target);

        const tween = this._tweens.domElement = this._getDomElementTween();

        tween
            .to({
                opacity: 1
            }, 300, createjs.Ease.quadInOut)
    }

    hide() {
        createjs.Tween.removeTweens(this._tweens.domElement.target);

        const tween = this._tweens.domElement = this._getDomElementTween();

        tween
            .to({
                opacity: 0
            }, 300, createjs.Ease.quadInOut)
    }

    _getSpotLightTween() {
        const tween = createjs.Tween.get({
            x: this._spotLight.position.x,
            y: this._spotLight.position.y,
            z: this._spotLight.position.z,
            intensity: this._spotLight.intensity
        });

        tween.addEventListener('change', (event) => {
            const tween = event.target.target;

            this._spotLight.position.set(tween.x, tween.y, tween.z);
            this._spotLight.intensity = tween.intensity;
        });

        return tween;
    };

    _getCameraTween0() {
        let target = {
            x: this._camera.position.x,
            y: this._camera.position.y,
            z: this._camera.position.z
        };

        if (this._tweens.camera0) {
            const _target = this._tweens.camera0.target;

            target = {
                x: _target.x,
                y: _target.y,
                z: _target.z
            }
        }

        const tween = createjs.Tween.get(target, { override: true }),
            _vec3 = new Vector3;

        tween.addEventListener('change', (event) => {
            const tween0 = event.target.target;
            const tween1 = this._tweens.camera1.target;

            this._camera.position.set(tween0.x, tween0.y, tween0.z);
            _vec3.set(tween1.lookAtX, tween1.lookAtY, tween1.lookAtZ);
            this._camera.lookAt(_vec3);
        });

        return tween;
    }

    _getCameraTween1() {
        let target = {
            lookAtX: this._scene.position.x,
            lookAtY: this._scene.position.y,
            lookAtZ: this._scene.position.z
        };

        if (this._tweens.camera1) {
            const _target = this._tweens.camera1.target;

            target = {
                lookAtX: _target.lookAtX,
                lookAtY: _target.lookAtY,
                lookAtZ: _target.lookAtZ
            }
        }

        const tween = createjs.Tween.get(target, { override: true }),
            _vec3 = new Vector3;

        tween.addEventListener('change', (event) => {
            const tween0 = this._tweens.camera0.target;
            const tween1 = event.target.target;

            this._camera.position.set(tween0.x, tween0.y, tween0.z);
            _vec3.set(tween1.lookAtX, tween1.lookAtY, tween1.lookAtZ);
            this._camera.lookAt(_vec3);
        });

        return tween;
    }

    _getGroundTween() {
        let target = {
            opacity: 0
        };

        if (this._tweens.ground) {
            target = {
                opacity: this._tweens.ground.target.opacity
            };
        }

        const tween = createjs.Tween.get(target);

        tween.addEventListener('change', (event) => {
            const tween = event.target.target;

            this._ground.material.opacity = tween.opacity;
        });

        return tween;
    }
    
    _getDomElementTween() {
        let opacity = 0;

        if (this._tweens.domElement) {
            opacity = this._tweens.domElement.target.opacity;
        }

        const tween = createjs.Tween.get({ opacity });

        tween.addEventListener('change', event => {
            const opacity = +event.target.target.opacity,
                domElementStyle = this._renderer.domElement.style;

            domElementStyle.opacity = opacity;

            if (opacity === 0) {
                domElementStyle.display = 'none';
            } else if (domElementStyle.display === 'none') {
                domElementStyle.display = 'block';
            }
        });

        return tween;
    }
}