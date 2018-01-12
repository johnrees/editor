import * as THREE from "three";
import * as Rx from "rxjs";

export const setPlaneAndOriginalVertices = (plane, mouseMove$, faceOutline) => ([[_, intersections], vertices]) => {
  const intersection = intersections[0]

  // debugPlane.position.copy(intersection.point);
  // debugPlane.lookAt(
  //   intersection.point
  //     .clone()
  //     .add(intersection.face.normal)
  // );

  const planePoints = [
    intersection.point,
    new THREE.Vector3().add(intersection.point).add(intersection.face.normal),
    new THREE.Vector3().add(intersection.point).add(new THREE.Vector3(0,1,0))
  ]
  // const planePoints = debugPlane.userData.pts();

  plane.setFromCoplanarPoints(...planePoints)
  faceOutline.geometry.dispose()
  const planeGeometry = new THREE.Geometry();
  planeGeometry.vertices = planePoints;
  planeGeometry.faces.push(new THREE.Face3(0,1,2));
  plane.geometry = planeGeometry;

  return mouseMove$.withLatestFrom(
    Rx.Observable.of({
      intersection,
      vertices,
      origVertices: vertices.map( (v:THREE.Vector3) => v.clone())
    })
  )
}

export const extrudeVertices = (raycaster, plane, planeIntersection) => ([_, {intersection, vertices, origVertices}]) => {
  if (raycaster.ray.intersectPlane(plane,planeIntersection)) {
    const toAdd = new THREE.Vector3().multiplyVectors(
      intersection.face.normal,
      planeIntersection.sub(intersection.point).multiply(intersection.face.normal)
    );
    vertices.forEach((vert:THREE.Vector3, index) => {
      vert.copy(origVertices[index].clone().add(toAdd));
    });
    intersection.object.geometry.verticesNeedUpdate = true;
    intersection.object.geometry.computeBoundingSphere();
    return Rx.Observable.of(1)
  }
}
