import * as THREE from "three";

export function getPosition(
  x: number,
  y: number,
  width: number,
  height: number
): [number, number] {
  return [x / width * 2 - 1, -(y / height) * 2 + 1];
}

/**
 * Used instead of Vector3.equals() to check for checking if vectors that are
 * probably on the same face.
 **/
export function nearlyEqual(
  vector1: THREE.Vector3,
  vector2: THREE.Vector3,
  maxDifference: number = 0.0001
): boolean {
  return (
    Math.abs(vector1.x - vector2.x) < maxDifference &&
    Math.abs(vector1.y - vector2.y) < maxDifference &&
    Math.abs(vector1.z - vector2.z) < maxDifference
  );
}

export function flatten(arr) {
  return arr.reduce((acc, arr) => [...acc, ...arr], []);
}
