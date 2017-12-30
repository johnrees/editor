import * as THREE from "three";
import * as React from "react";
import camera from "./camera";
import model from "./model";
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
  private model;

  constructor(props) {
    super(props);
    const { width, height, bgColor } = props;
    this.camera = camera(width, height);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setClearColor(bgColor);
    this.renderer.setSize(width, height);
    this.scene = new THREE.Scene();

    this.model = model([[-1, 0], [-1, 1], [0, 2], [1, 1], [1, 0]]);

    this.scene.add(this.model);
  }

  handleMouseDown(event) {
    this.model.rotation.y += 1;
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
