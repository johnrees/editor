import * as THREE from "three";

const camera = (width, height, target = new THREE.Vector3(0, 0, 0)) => {
  const cam = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
  cam.position.copy(new THREE.Vector3(10, 20, -20));
  cam.lookAt(target);
  return cam;
};

export default camera;
