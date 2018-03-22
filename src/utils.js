/**
 * Created by qhyang on 2018/1/15.
 */

import * as THREE from 'three';
import Physijs from './vendors/physijs/physi';
import './vendors/three/ConvexGeometry';
import * as THREEx from './vendors/threex.geometricglow/threex';

import { musicNote, play } from './layouts';

const model = [
        [
            [-10, -10, -2], [-10, 10, -2], [10, 10, -2], [10, -10, -2],
            [-11, -10, -1], [-10, -11, -1], [-11, 10, -1], [-10, 11, -1], [11, 10, -1], [10, 11, -1], [11, -10, -1], [10, -11, -1],
            [-11, -10, 1], [-10, -11, 1], [-11, 10, 1], [-10, 11, 1], [11, 10, 1], [10, 11, 1], [11, -10, 1], [10, -11, 1],
            [-10, -10, 2], [-10, 10, 2], [10, 10, 2], [10, -10, 2],
            [-3, -9, 3], [3, 7, 4]
        ]
    ],

    generateTile = ({ color } = {}) => {
        const geometry = new THREE.ConvexGeometry(model[0].map(vertex => new THREE.Vector3(vertex[0], vertex[1], vertex[2]))),
            material = Physijs.createMaterial(
                new THREE.MeshPhongMaterial({
                    emissive: color,
                    color: color,
                    specular: 0x222222,
                    shininess: 60,
                    opacity: .8,
                    transparent: true
                }),
            1, 1.1),
            mesh = new Physijs.ConvexMesh(geometry, material),
            frame = new THREE.EdgesHelper(mesh, 0xffffff);

        frame.material.opacity = .2;
        frame.material.transparent = true;

        mesh.add(frame);

        return mesh;
    },

    generatePlane = ({ width, height, opacity = 1, restitution = .6, texture } = { restitution: .5, opacity: 1 }) => {
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
            default:
                return musicNote;
        }
    };

export { generateTile, generatePlane, glow, getLayout };
