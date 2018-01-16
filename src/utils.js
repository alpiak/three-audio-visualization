/**
 * Created by qhyang on 2018/1/15.
 */

import * as THREE from 'three';
import Physijs from './vendors/physijs/physi';
import './vendors/three/ConvexGeometry';

const model = [
        [
            [-10, -10, -2], [-10, 10, -2], [10, 10, -2], [10, -10, -2],
            [-11, -10, -1], [-10, -11, -1], [-11, 10, -1], [-10, 11, -1], [11, 10, -1], [10, 11, -1], [11, -10, -1], [10, -11, -1],
            [-11, -10, 1], [-10, -11, 1], [-11, 10, 1], [-10, 11, 1], [11, 10, 1], [10, 11, 1], [11, -10, 1], [10, -11, 1],
            [-10, -10, 2], [-10, 10, 2], [10, 10, 2], [10, -10, 2],
            [-3, -9, 3], [3, 7, 4]
        ]
    ],
    generateTile = () => {
        const geometry = new THREE.ConvexGeometry(model[0].map(vertex => new THREE.Vector3(vertex[0], vertex[1], vertex[2]))),
            material = new THREE.MeshPhongMaterial({
                emissive: 0x071c25,
                color: 0x2eade8,
                specular: 0xffffff,
                shininess: 60,
                opacity: .8,
                transparent: true
            }),
            mesh = new Physijs.ConvexMesh(geometry, material),
            frame = new THREE.EdgesHelper(mesh, 0x888888);

        mesh.add(frame);

        return mesh;
    }

export { generateTile };