import * as THREE from "three";

function DebugPlane(visible: boolean = true): THREE.Mesh {
  const planeGeometry = new THREE.PlaneGeometry(3, 3, 1, 1);
  const planeMaterial = new THREE.MeshBasicMaterial({
    color: "red",
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(planeGeometry, planeMaterial);

  mesh.userData.pts = () => {
    mesh.updateMatrixWorld(true);
    return [
      mesh.position,
      mesh.localToWorld(new THREE.Vector3(0, 0, 1)),
      mesh.localToWorld(new THREE.Vector3(0, 1, 0))
    ];
  };

  mesh.visible = visible;
  return mesh;
}

export default DebugPlane;
