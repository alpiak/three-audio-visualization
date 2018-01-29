/**
 * Created by qhyang on 2018/1/12.
 */

import * as THREE from 'three';
import Physijs from './vendors/physijs/physi';
import { createjs } from './vendors/createjs/tweenjs';
import ColorPlugin from './vendors/createjs/ColorPlugin';

import { generateTile, generatePlane, glow } from './utils';
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
    _ground;
    _tween = {
        spotLight: null,
        camera: null,
        ground: null
    };

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
        this._scene.setGravity(new THREE.Vector3( 0, -300, 0 ));
        this._camera = new THREE.PerspectiveCamera(45, width / height, .1, 1000);
        this._renderer = new THREE.WebGLRenderer({ alpha: true });

        this._renderer.setSize(width, height);
        this._renderer.setClearAlpha(0);
        this._renderer.shadowMapEnabled = true;

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
            tile.castShadow = true;
            this._scene.add(tile);
            this._tiles[index] = {
                color: '#' + _color.getHex().toString(16),
                object: tile
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

    switchMode(mode) {
        switch (mode) {
            case 'physics':
                this._tiles.forEach(tileItem => {
                    tileItem.object.__dirtyPosition = true;
                    tileItem.object.__dirtyRotation = true;
                });

                this._tween.camera
                    .to({
                        lookAtX: this._ground.position.x,
                        lookAtY: this._ground.position.y + 60,
                        lookAtZ: this._ground.position.z
                    }, 5000, createjs.Ease.quartInOut)
                    .setPaused(false);

                this._tween.ground
                    .to({
                        opacity: 1
                    }, 5000, createjs.Ease.quartInOut)
                    .setPaused(false);

                this._simulating = true;

                this._tween.spotLight
                    .to({
                        x: 0,
                        y: 0,
                        z: 0,
                        intensity: 2
                    }, 3000, createjs.Ease.quartInOut)
                    .setPaused(false);

                this._spotLight.target = this._ground;

                break;
            case 'basic':
                this._simulating = false;
                break;
        }
    }
}