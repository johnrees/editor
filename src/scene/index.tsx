import * as THREE from "three";
import * as React from "react";
import camera from "./camera";
// import * as Rx from "rxjs/Rx";

interface IProps {
  width: number;
  height: number;
  bgColor: string | number;
}

export default class Scene extends React.Component<IProps> {
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private box;

  constructor(props) {
    super(props);
    const { width, height, bgColor } = props;
    this.camera = camera(width, height);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setClearColor(bgColor);
    this.renderer.setSize(width, height);
    this.scene = new THREE.Scene();

    this.box = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshNormalMaterial()
    );

    this.scene.add(this.box);
  }

  handleMouseDown(event) {
    this.box.rotation.y += 1;
    this.render3D();
  }

  render3D() {
    this.renderer.render(this.scene, this.camera);
  }

  componentDidMount() {
    (this.refs.scene as HTMLDivElement).appendChild(this.renderer.domElement);
    this.render3D();
  }

  render() {
    return (
      <div
        ref="scene"
        id="scene"
        onMouseDown={this.handleMouseDown.bind(this)}
      />
    );
  }
}
