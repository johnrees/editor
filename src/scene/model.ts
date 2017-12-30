import * as THREE from "three";

const material = new THREE.MeshNormalMaterial();
const extrudeSettings = {
  amount: 0.1,
  bevelEnabled: false,
  step: 1
};

const model = edges => {
  const shape = new THREE.Shape();
  edges.forEach(([x, y], index) => {
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
};

export default model;
