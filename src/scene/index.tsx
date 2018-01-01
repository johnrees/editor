import * as THREE from "three";
import * as React from "react";
import camera from "./camera";
import model from "./model";
import * as Rx from "rxjs/Rx";
import { getPosition } from "./utils";

interface IProps {
  width: number;
  height: number;
  bgColor: string | number;
}

export default class Scene extends React.Component<IProps> {
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private model;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private scene: THREE.Scene = new THREE.Scene();

  constructor(props) {
    super(props);
    const { width, height, bgColor } = props;
    this.camera = camera(width, height);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setClearColor(bgColor);
    this.renderer.setSize(width, height);

    this.model = model([[-2, 0], [-2, 2.5], [0, 3.6], [2, 2.5], [2, 0]]);

    this.scene.add(this.model);
  }

  handleMouseDown(event) {
    this.model.rotation.y += 1;
    requestAnimationFrame(this.render3D.bind(this));
  }

  render3D() {
    this.renderer.render(this.scene, this.camera);
  }

  componentDidMount() {
    const el = this.refs.scene as HTMLDivElement;
    el.appendChild(this.renderer.domElement);

    // return a 1 or 0 depending on if hovering over building
    Rx.Observable.fromEvent(el, "mousemove")
      .throttleTime(50)
      .map(({ clientX, clientY }) =>
        getPosition(clientX, clientY, this.props.width, this.props.height)
      )
      .map(([x, y]) => {
        this.raycaster.setFromCamera({ x, y }, this.camera);
        return this.raycaster.intersectObject(this.model).length;
      })
      .distinctUntilChanged()
      .subscribe(console.log);

    // return mousewheel delta
    Rx.Observable.fromEvent(el, "mousewheel")
      .throttleTime(20)
      .pluck("deltaY")
      .subscribe(console.log);

    requestAnimationFrame(this.render3D.bind(this));
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
