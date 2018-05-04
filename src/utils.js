/**
 * Created by qhyang on 2018/1/15.
 */

import { Color, Vector3, MeshLambertMaterial, MeshPhongMaterial, EdgesHelper, PlaneGeometry } from 'three';
import { ConvexGeometry } from './vendors/three/ConvexGeometry'
import Physijs from './vendors/physijs/physi';
import './vendors/three/ConvexGeometry';
import * as THREEx from './vendors/threex.geometricglow/threex';

import { musicNote, play, pause, stop, previousTrack, nextTrack } from './layouts';

const models = [
        [
            [-3, -9, -3], [2, 2, -3.8],
            [-10, -10, -2], [-10, 10, -2], [10, 10, -2], [10, -10, -2],
            [-11, -10, -1], [-10, -11, -1], [-11, 10, -1], [-10, 11, -1], [11, 10, -1], [10, 11, -1], [11, -10, -1], [10, -11, -1],
            [-11, -10, 1], [-10, -11, 1], [-11, 10, 1], [-10, 11, 1], [11, 10, 1], [10, 11, 1], [11, -10, 1], [10, -11, 1],
            [-10, -10, 2], [-10, 10, 2], [10, 10, 2], [10, -10, 2],
            [-3.5, -9, 3], [2.5, 7, 4]
        ]
    ],

    generateTile = ({ color, restitution = .95 } = {}) => {
        const geometry = new ConvexGeometry(models[0].map(vertex => new Vector3(vertex[0], vertex[1], vertex[2]))),
            material = Physijs.createMaterial(
                new MeshPhongMaterial({
                    emissive: color,
                    color,
                    specular: 0x222222,
                    shininess: 60,
                    opacity: .8,
                    transparent: true
                }),
            1, restitution),
            mesh = new Physijs.ConvexMesh(geometry, material),
            frame = new EdgesHelper(mesh, 0xffffff);

        frame.material.opacity = new Color(color).getHSL().l / 8.5;
        frame.material.transparent = true;

        mesh.add(frame);

        mesh.rotation.x = Math.PI * Math.floor(Math.random() * 2);
        mesh.rotation.y = Math.PI * Math.floor(Math.random() * 2);
        mesh.rotation.z = Math.PI / 2 * Math.floor(Math.random() * 4);

        return mesh;
    },

    generatePlane = ({ width, height, opacity = 1, restitution = .8, texture } = {}) => {
        const geometry = new PlaneGeometry(width, height, 1, 1),
            material = Physijs.createMaterial(
                new MeshLambertMaterial({
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
