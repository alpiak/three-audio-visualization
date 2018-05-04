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
        this._spotLight.target = this._scene;
        this._spotLight.castShadow = true;
        this._tweens.spotLight = this._getSpotLightTween();
        this._scene.add(this._spotLight);

        // TODO: remove later
        this._scene.add(new THREE.SpotLightHelper(this._spotLight));

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
            const tile = generateTile({ color: new THREE.Color(color).offsetHSL(0, 0, tileData.l) });

            tile.position.set(...tileData.coords);
            // glow(tile);
            tile.castShadow = true;
            this._scene.add(tile);
            this._tiles[index] = {
                color: '#' + new THREE.Color(color).getHex().toString(16),
                lightness: tileData.l,
                body: tile,

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
            color = '#' + new THREE.Color(color).getHexString();
        }

        const tile = this._tiles[index],
            tileBody = tile.body;

        if (!this._tweens.tiles0[index]) {
            this._tweens.tiles0[index] = this._getTileTween0(index);
        }

        const tween = this._tweens.tiles0[index];

        if (!tile.rotationX) {
            tile.rotationX = tileBody.rotation.x;
        }

        if (!tile.rotationY) {
            tile.rotationY = tileBody.rotation.y;
        }

        if (!tile.rotationZ) {
            tile.rotationZ = tileBody.rotation.z;
        }

        return new Promise(resolve => {

            tween
                .to({
                    rotationX: tile.rotationX + rotationX,
                    rotationY: tile.rotationY + rotationY * tile.rotationYAdjust,
                    rotationZ: tile.rotationZ + rotationZ,
                    color: '#' + new THREE.Color(color || tile.color).offsetHSL(0, 0, tile.lightness).getHexString()
                }, 300, createjs.Ease.circInOut)
                .to({
                    rotationX: tile.rotationX,
                    rotationY: tile.rotationY,
                    rotationZ: tile.rotationZ,
                    color: '#' + new THREE.Color(tile.color).offsetHSL(0, 0, tile.lightness).getHexString()
                }, 3600, createjs.Ease.getElasticOut(1.8, .2))
                .call(() => {
                    tileBody.updateMatrix();
                    resolve();
                })
                .paused = false;
        });
    }

    /**
     * Roll over a tile.
     * @param {Number} index
     * @param {Object} [options] - Options.
     * @param {String} [options.color]
     * @param {String} [options.direction=vertical] - Value from ['vertical', 'horizontal']
     */
    rollOverTile(index, { color, direction = 'vertical' } = {}) {
        if (color && !/^#/.test(color)) {
            color = '#' + new THREE.Color(color).getHexString();
        }

        const tile = this._tiles[index],
            tileBody = tile.body;

        if (!this._tweens.tiles0[index]) {
            this._tweens.tiles0[index] = this._getTileTween0(index);
        }

        const tween = this._tweens.tiles0[index];

        if (!tile.rotationX) {
            tile.rotationX = tileBody.rotation.x;
        }

        if (!tile.rotationY) {
            tile.rotationY = tileBody.rotation.y;
        }

        if (!tile.rotationZ) {
            tile.rotationZ = tileBody.rotation.z;
        }

        let target = {
            color: '#' + new THREE.Color(color || tile.color).offsetHSL(0, 0, tile.lightness).getHexString()
        };

        switch (direction) {
            case 'vertical':
                tile.rotationX -= Math.PI;
                target.rotationX = tile.rotationX;
                tile.rotationYAdjust *= -1;
                tile.rotationZAdjust *= -1;
                break;
            case 'horizontal':
                tile.rotationY += Math.PI * tile.rotationYAdjust;
                target.rotationY = tile.rotationY;
                tile.rotationZAdjust *= -1;
                break;
            case 'cross':
                tile.rotationY += Math.PI * tile.rotationYAdjust;
                tile.rotationZ -= Math.PI * tile.rotationZAdjust;
                target.rotationY = tile.rotationY;
                target.rotationZ = tile.rotationZ;
                tile.rotationZAdjust *= -1;
                break;
        }

        tile.color = color;

        return new Promise(resolve => {
            tween.to(target, 500, createjs.Ease.quadInOut)
                .call(resolve)
                .paused = false;
        });
    }

    floatTile(index, offset) {
        if (!this._tweens.tiles1[index]) {
            this._tweens.tiles1[index] = this._getTileTween1(index);
        }

        if (!this._tweens.tiles2[index]) {
            this._tweens.tiles2[index] = this._getTileTween2(index);
        }

        const tween = this._tweens.tiles1[index];

        return new Promise(resolve => {
            tween
                .wait(1800 * Math.random())
                .to({ floatOffset: offset }, 3000 + 3000 * Math.random(), createjs.Ease.quadInOut)
                .wait(1800 * Math.random())
                .to({ floatOffset: 0 }, 3000 + 3000 * Math.random(), createjs.Ease.quadInOut)
                .call(resolve)
                .paused = false;
        });
    }

    waveTiles({ x = -100, y = -100, z = 0, speed = .1, power = 1, type = 'shake', type: { animationType, direction }, color } = {}) {
        this._tiles.forEach((tile, index) => {
            const tileBody = tile.body,
                waveSourcePosition = new THREE.Vector3(x, y, z),
                distanceX = tileBody.position.x - x,
                distanceY = tileBody.position.y - y,
                distanceZ = tileBody.position.z - z;

            return new Promise(resolve => {
                setTimeout(async () => {
                    let _type;

                    if (animationType) {
                        _type = animationType;
                    } else {
                        _type = type;
                    }

                    switch (_type) {
                        case 'rollover':
                            if (!direction) {
                                direction = (() => {
                                    if (x === y) {
                                        return 'cross';
                                    }

                                    return Math.abs(distanceX) < Math.abs(distanceY) ? 'vertical' : 'horizontal';
                                })();
                            }

                            await this.rollOverTile(index, {
                                direction,
                                color
                            });
                            break;
                        case 'shake':
                        default:
                            const rotation = [];

                            rotation[0] = -distanceX && Math.PI / 2 * power / -distanceX;
                            rotation[1] = distanceY && Math.PI / 2 * power / distanceY;
                            rotation[2] = distanceZ && Math.PI / 2 * power / distanceZ;

                            rotation.forEach(component => {
                                component = Math.min(component, Math.Pi / 2);
                            });

                            await this.shakeTile(index, {
                                rotationX: rotation[0],
                                rotationY: rotation[1],
                                rotationZ: rotation[2],
                                color
                            });
                    }

                    resolve();
                }, tileBody.position.distanceTo(waveSourcePosition) / speed);
            });
        });
    }

    startFloatingTiles(offset, { color } = {}) {
        this._tiles.forEach((tile, index) => {
            tile.floating = true;

            let direction = Math.random() > .5 ? 1 : -1;

            const animate = async () => {
                await this.floatTile(index, offset * direction, { color });

                if (tile.floating === true) {
                    direction *= -1;
                    animate();
                }
            };

            animate();
        });
    }

    stopFloatingTiles() {
        this._tiles.forEach(tile => {
            tile.floating = false;
        });
    }

    /**
     * Switch to another layout of tiles with animation.
     * @param {string|Array[]} [layout=musicNote] - The layout of tiles, can be a string for a build-in layout or an array of arrays for a custom layout.
     */
    switchLayout(layout = 'musicNote') {
        this._currentLayout = layout;

        let tilesData;

        if (typeof layout === 'string') {
            tilesData = getLayout(layout);
        } else if (Object.prototype.toString.call(layout) == '[object Array]') {
            tilesData = layout;
        } else {
            tilesData = getLayout('musicNote');
        }

        const fadeOutOffset = 100,
            lengthDiff = tilesData.length - this._tiles.length;

        if (lengthDiff > 0) {
            for (let i = tilesData.length - lengthDiff - 1; i < tilesData.length; i++) {
                const color = this._tiles[0].color,
                    tile = generateTile({ color: new THREE.Color(color).offsetHSL(0, 0, tilesData[i].l) });

                tile.position.set(tilesData[i].coords[0], 0, fadeOutOffset);
                tile.material.opacity = 0;
                // glow(tile);
                tile.castShadow = true;
                this._scene.add(tile);
                this._tiles.push({
                    color,
                    lightness: tilesData[i].l,
                    body: tile,

                    // Adjust the rotation direction, value from [-1, 1].
                    rotationYAdjust: 1,
                    rotationZAdjust: 1
                });
            }
        }

        this._tiles.forEach((tile, index) => {
            const tileBody = tile.body;

            if (!this._tweens.tiles0[index]) {
                this._tweens.tiles0[index] = this._getTileTween0(index);
            } else {
                this._tweens.tiles0[index].to({
                    color: '#' + new THREE.Color(tile.color).offsetHSL(0, 0, tile.lightness).getHexString(),
                    opacity: tileBody.material.opacity / .8
                }, 0);
            }

            if (!this._tweens.tiles1[index]) {
                this._tweens.tiles1[index] = this._getTileTween1(index);
            }

            if (!this._tweens.tiles2[index]) {
                this._tweens.tiles2[index] = this._getTileTween2(index);
            }

            const tween0 = this._tweens.tiles0[index],
                tween2 = this._tweens.tiles2[index];

            if (index < tilesData.length) {
                tween0
                    .to({ opacity: 1 }, 1000, createjs.Ease.quintOut)
                    .paused = false;

                tween2
                    .to({
                        x: tilesData[index].coords[0],
                        y: tilesData[index].coords[1],
                        z: tilesData[index].coords[2]
                    }, 1000, createjs.Ease.quintOut)
                    .paused = false;
            } else {
                tween0
                    .to({ opacity: 0 }, 1000, createjs.Ease.quintOut)
                    .paused = false;

                tween2
                    .to({
                        z: fadeOutOffset
                    }, 1000, createjs.Ease.quintOut)
                    .paused = false;
            }
        });

        return new Promise(resolve => setTimeout(() => resolve(), 1000));
    }

    moveLight({ x, y, z, duration } = {}) {
        const spotLight = this._spotLight;

        return new Promise(resolve => {
            this._tweens.spotLight
                .to({
                    x: x || spotLight.position.x,
                    y: y || spotLight.position.y,
                    z: z || spotLight.position.z
                }, duration || 10000, createjs.Ease.circInOut)
                .call(resolve)
                .paused = false;
        });
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

        const _vec3 = new THREE.Vector3;

        switch (mode) {
            case 'physics':
                this._simulating = true;

                requestAnimationFrame(() => {
                    _vec3.set(0, 0, 0);

                    this._tiles.forEach(({ body }) => {
                        body.__dirtyPosition = true;
                        body.__dirtyRotation = true;
                        body.setAngularFactor(_vec3);
                        body.setAngularVelocity(_vec3);
                        body.setLinearFactor(_vec3);
                        body.setLinearVelocity(_vec3);
                    });

                    const randomTile = this._tiles[Math.floor(this._tiles.length * Math.random())];

                    _vec3.set(1, 1, 1);

                    this._tiles.forEach(({ body }) => {
                        setTimeout(() => {
                            body.setAngularFactor(_vec3);
                            body.setLinearFactor(_vec3);
                        }, body.position.distanceTo(randomTile.body.position) * 8);
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
        const _vec3 = new THREE.Vector3;

        this._tiles.forEach(({ body }) => {
            const groupSize = 100 / forces.length; // The radius range of a ring area.

            _vec3.set(body.position.x, 0, body.position.z);

            const distance = _vec3.distanceTo(this._scene.position); // Distance to the center.

            for (let i = 0; i < forces.length; i++) {
                if (distance < i * groupSize) {
                    continue;
                }

                if (distance < (i + 1) * groupSize || i === forces.length - 1) {
                    _vec3.set(0, forces[i], 0);

                    if (body.position.y + body.geometry.boundingBox.min.y < -249) {
                        body.applyCentralImpulse(_vec3);
                    }
                    break;
                }
            }
        });
    }

    enableReactiveCamera() {
        const _previousVec2 = new THREE.Vector2,
            _vec2 = new THREE.Vector2;

        _onMouseMove = (e) => {
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
        };

        document.addEventListener('mousemove', _onMouseMove);
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

    _getTileTween0(index) {
        const tile = this._tiles[index],
            body = tile.body,
            tween = createjs.Tween.get({
                rotationX: body.rotation.x,
                rotationY: body.rotation.y,
                rotationZ: body.rotation.z,
                color: '#' + new THREE.Color(tile.color).offsetHSL(0, 0, tile.lightness).getHexString(),
                opacity: body.material.opacity / .8
            });

        tween.addEventListener('change', e => {
            const tweenTarget = e.target.target,
                color = tweenTarget.color.replace(/-[0-9]+,/g, '0,');

            body.rotation.set(tweenTarget.rotationX, tweenTarget.rotationY, tweenTarget.rotationZ);
            body.material.emissive.setStyle(color);
            body.material.color.setStyle(color);
            body.material.opacity = tweenTarget.opacity * .8;
            body.children[0].material.opacity = body.material.color.getHSL().l / 85 * tweenTarget.opacity;

            if (tweenTarget.opacity < .5) {
                // tile.children[1].visible = false;
            }
        });

        return tween;
    }

    _getTileTween1(index) {
        const tile = this._tiles[index],
            body = tile.body,
            tween = createjs.Tween.get({
                floatOffset: 0
            });

        tween.addEventListener('change', e => {
            const tweenTarget = e.target.target,
                tweenTarget2 = this._tweens.tiles2[index].target;

            body.position.set(tweenTarget2.x, tweenTarget2.y, tweenTarget2.z + tweenTarget.floatOffset);
        });

        return tween;
    }

    _getTileTween2(index) {
        const tile = this._tiles[index],
            body = tile.body,
            tween = createjs.Tween.get({
                x: body.position.x,
                y: body.position.y,
                z: body.position.z
            });

        tween.addEventListener('change', e => {
            const tweenTarget = e.target.target,
                tweenTarget1 = this._tweens.tiles1[index].target;

            body.position.set(tweenTarget.x, tweenTarget.y, tweenTarget.z + tweenTarget1.floatOffset);
        });

        return tween;
    }

    _getSpotLightTween() {
        const tween = createjs.Tween.get({
            x: this._spotLight.position.x,
            y: this._spotLight.position.y,
            z: this._spotLight.position.z,
            intensity: this._spotLight.intensity
        });

        tween.addEventListener('change', e => {
            const tween = e.target.target;

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
            _vec3 = new THREE.Vector3;

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
            _vec3 = new THREE.Vector3;

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