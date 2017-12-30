import * as THREE from "three";
import * as React from "react";
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

  constructor(props) {
    super(props);
    const { width, height, bgColor } = props;
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setClearColor(bgColor);
    this.renderer.setSize(width, height);
    this.scene = new THREE.Scene();
  }

  handleMouseDown(event) {
    console.log("mouseDown");
  }

  render3D() {
    this.renderer.render(this.scene, this.camera);
  }

  componentDidMount() {
    (this.refs.scene as HTMLDivElement).appendChild(this.renderer.domElement);
    this.render3D();
  }

  render() {
    return <div ref="scene" id="scene" onMouseDown={this.handleMouseDown} />;
  }
}
