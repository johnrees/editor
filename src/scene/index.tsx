import * as THREE from "three";
import * as React from "react";
import camera from "./camera";
import model from "./model";
import * as Rx from "rxjs/Rx";

function getPosition(
  x: number,
  y: number,
  width: number,
  height: number
): [number, number] {
  return [x / width * 2 - 1, -(y / height) * 2 + 1];
}

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
    this.render3D();
  }

  // handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
  //   const [x, y] = getPosition(
  //     event.clientX,
  //     event.clientY,
  //     this.props.width,
  //     this.props.height
  //   );
  //   this.raycaster.setFromCamera({ x, y }, this.camera);
  //   const intersects = this.raycaster.intersectObject(this.model);
  //   if (intersects.length > 0) {
  //     console.log("over");
  //   } else {
  //     console.log("off");
  //   }
  // }

  render3D() {
    this.renderer.render(this.scene, this.camera);
  }

  componentDidMount() {
    (this.refs.scene as HTMLDivElement).appendChild(this.renderer.domElement);
    this.render3D();

    Rx.Observable.fromEvent(this.refs.scene as HTMLDivElement, "mousemove")
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
  }

  render() {
    return (
      <div
        ref="scene"
        id="scene"
        onMouseDown={this.handleMouseDown.bind(this)}
        // onMouseMove={this.handleMouseMove.bind(this)}
      />
    );
  }
}
