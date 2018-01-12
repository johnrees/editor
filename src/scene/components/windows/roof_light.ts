import * as THREE from "three";

function RoofLight() {
  return new THREE.Mesh(
    new THREE.BoxGeometry(1,2,0.2),
    new THREE.MeshNormalMaterial()
  )
}

export default RoofLight;
