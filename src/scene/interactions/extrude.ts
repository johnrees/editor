import * as THREE from "three";
import * as Rx from "rxjs";

export const setPlaneAndOriginalVertices = (plane, mouseMove$) => ([[mousedown, intersections], vertices]) => {
  const intersection = intersections[0]
  plane.setFromCoplanarPoints(
    intersection.point,
    intersection.point.clone()
                      .add(intersection.face.normal),
    intersection.point.clone()
      .add(new THREE.Vector3(0,1,0))
  )
  return mouseMove$.withLatestFrom(
    Rx.Observable.of({
      intersection,
      vertices,
      origVertices: vertices.map( (v:THREE.Vector3) => v.clone())
    })
  )
}

export const extrudeVertices = (raycaster, plane, planeIntersection) => ([mousePosition, {intersection, vertices, origVertices}]) => {
  if (raycaster.ray.intersectPlane(plane,planeIntersection)) {
    const toAdd = new THREE.Vector3().multiplyVectors(
      intersection.face.normal,
      planeIntersection.clone().sub(intersection.point)
    );
    vertices.forEach((vert:THREE.Vector3, index) => {
      vert.copy(origVertices[index].clone().add(toAdd));
    });
    intersection.object.geometry.verticesNeedUpdate = true;
    intersection.object.geometry.computeBoundingSphere();
    return Rx.Observable.of(1)
  }
}
