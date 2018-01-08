import * as Rx from "rxjs";
import * as THREE from "three";
import { nearlyEqual, flatten } from "../utils";

export const extrude = (mouseMove$) => ([[mousedown, intersections], vertices]) => {
  const intersection = intersections[0]
  vertices.forEach( (vert:THREE.Vector3) => {
    vert.addScaledVector(intersection.face.normal, 1);
  });
  intersection.object.geometry.verticesNeedUpdate = true;
  intersection.object.geometry.computeBoundingSphere();
  return mouseMove$
}
