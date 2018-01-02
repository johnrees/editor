import * as THREE from "three";

const renderer = (width, height, bgColor = 0x000000) => {
  const _renderer = new THREE.WebGLRenderer({ antialias: true });
  _renderer.setClearColor(bgColor);
  _renderer.setSize(width, height);
  return _renderer;
};

export default renderer;
