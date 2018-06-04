/**
 * Created by qhyang on 2018/1/15.
 */

import * as THREE from 'three';
import { ConvexGeometry } from './vendors/three/ConvexGeometry'
import Physijs from './vendors/physijs/physi';
import './vendors/three/ConvexGeometry';
import * as THREEx from './vendors/threex.geometricglow/threex';

import { musicNote, play, pause, stop, previousTrack, nextTrack } from './layouts';

const models = [
        [
            [-3.5, -9, -3], [2.5, 7, -4],
            [-10, -10, -2], [-10, 10, -2], [10, 10, -2], [10, -10, -2],
            [-11, -10, -1], [-10, -11, -1], [-11, 10, -1], [-10, 11, -1], [11, 10, -1], [10, 11, -1], [11, -10, -1], [10, -11, -1],
            [-11, -10, 1], [-10, -11, 1], [-11, 10, 1], [-10, 11, 1], [11, 10, 1], [10, 11, 1], [11, -10, 1], [10, -11, 1],
            [-10, -10, 2], [-10, 10, 2], [10, 10, 2], [10, -10, 2],
            [-3.5, -9, 3], [2.5, 7, 4]
        ]
    ],

    generateTile = ({ color, restitution = .95 } = {}) => {
        const rotationXMatrix = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI * Math.floor(Math.random() * 2));
        const rotationYMatrix = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), Math.PI * Math.floor(Math.random() * 2));
        const rotationZMatrix = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), Math.PI / 2 * Math.floor(Math.random() * 4));

        const geometry = new ConvexGeometry(models[0].map(vertex => new THREE.Vector3(vertex[0], vertex[1], vertex[2]).applyMatrix4(rotationXMatrix).applyMatrix4(rotationYMatrix).applyMatrix4(rotationZMatrix))),
            material = Physijs.createMaterial(
                new THREE.MeshPhongMaterial({
                    emissive: color,
                    color,
                    specular: 0x222222,
                    shininess: 60,
                    opacity: .8,
                    transparent: true
                }),
            1, restitution);

        return new Physijs.ConvexMesh(geometry, material);
    },

    generatePlane = ({ width, height, opacity = 1, restitution = .7, texture } = {}) => {
        const geometry = new THREE.PlaneGeometry(width, height, 1, 1),
            material = Physijs.createMaterial(
                new THREE.MeshLambertMaterial({
                    map: texture || null,
                    opacity: opacity,
                    transparent: true
                }),
            .9, restitution);

        return new Physijs.PlaneMesh(geometry, material, 0);
    },

    glow = mesh => {
        const glowMesh = new THREEx.GeometricGlowMesh(mesh);

        mesh.add(glowMesh.object3d);

        const insideUniforms = glowMesh.insideMesh.material.uniforms;

        insideUniforms.glowColor.value.set(0xeeeeee);

        const outsideUniforms = glowMesh.outsideMesh.material.uniforms;

        outsideUniforms.glowColor.value.set(0xeeeeee);
        // outsideUniforms.coeficient.value = .1;
        // outsideUniforms.power.value = 1.2;
    },

    getLayout = layoutType => {
        switch (layoutType) {
            case 'musicNote':
                return musicNote;
            case 'play':
                return play;
            case 'pause':
                return pause;
            case 'stop':
                return stop;
            case'previousTrack':
                return previousTrack;
            case'nextTrack':
                return nextTrack;
            default:
                return musicNote;
        }
    };

export { generateTile, generatePlane, glow, getLayout };
