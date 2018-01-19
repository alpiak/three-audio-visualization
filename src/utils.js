/**
 * Created by qhyang on 2018/1/15.
 */

import * as THREE from 'three';
import Physijs from './vendors/physijs/physi';
import './vendors/three/ConvexGeometry';
import * as THREEx from './vendors/threex.geometricglow/threex';

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
            material = new THREE.MeshPhongMaterial({
                emissive: 0x071c25,
                color: color,
                specular: 0x222222,
                shininess: 60,
                opacity: .8,
                transparent: true
            }),
            mesh = new Physijs.ConvexMesh(geometry, material),
            frame = new THREE.EdgesHelper(mesh, 0x888888);

        mesh.add(frame);

        return mesh;
    },

    glow = (mesh) => {
        const glowMesh = new THREEx.GeometricGlowMesh(mesh);

        mesh.add(glowMesh.object3d);

        const insideUniforms	= glowMesh.insideMesh.material.uniforms;

        insideUniforms.glowColor.value.set(0xc8eeff);

        const outsideUniforms	= glowMesh.outsideMesh.material.uniforms;

        outsideUniforms.glowColor.value.set(0xc8eeff);
        // outsideUniforms.coeficient.value = .1;
        // outsideUniforms.power.value = 1.2;
    };

export { generateTile, glow };