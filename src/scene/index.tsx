import * as THREE from "three";
import * as React from "react";
import camera from "./components/camera";
import model from "./components/model";
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

    this.render3D = this.render3D.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
  }

  handleMouseDown(event) {
    this.model.rotation.y += 1;
    requestAnimationFrame(this.render3D);
  }

  render3D() {
    console.log("render");
    this.renderer.render(this.scene, this.camera);
  }

  componentDidMount() {
    const { domElement } = this.renderer;

    const el = this.refs.scene as HTMLDivElement;
    el.appendChild(domElement);

    const mouseMove$ = Rx.Observable.fromEvent(domElement, "mousemove")
      .throttleTime(50)
      .map(({ clientX, clientY }) =>
        getPosition(clientX, clientY, this.props.width, this.props.height)
      );

    const mouseWheel$ = Rx.Observable.fromEvent(el, "mousewheel", {
      passive: true
    });

    const intersects$ = mouseMove$.flatMap(([x, y]) => {
      this.raycaster.setFromCamera({ x, y }, this.camera);
      return this.raycaster.intersectObject(this.model);
    });

    const outlineGeometry = new THREE.Geometry();
    outlineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
    outlineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
    outlineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
    outlineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));

    const line = new THREE.Line(
      outlineGeometry,
      new THREE.LineBasicMaterial({ color: 0xffffff })
    );
    this.scene.add(line);

    const activeFaces$ = intersects$
      .map((intersect: any) => {
        return [
          this.model.geometry.vertices[intersect.face.a],
          this.model.geometry.vertices[intersect.face.b],
          this.model.geometry.vertices[intersect.face.c],
          this.model.geometry.vertices[intersect.face.a]
        ];
      })
      .distinctUntilChanged((p: THREE.Vector3[], q: THREE.Vector3[]) => {
        return p[0].equals(q[0]) && p[1].equals(q[1]) && p[2].equals(q[2]);
      })
      .map((points: THREE.Vector3[]) => {
        outlineGeometry.vertices = points;
        outlineGeometry.verticesNeedUpdate = true;
      })
      .subscribe(() => {
        requestAnimationFrame(this.render3D);
      });

    mouseWheel$
      .throttleTime(20)
      .pluck("deltaY")
      .subscribe(console.log);

    requestAnimationFrame(this.render3D);
  }

  render() {
    return <div ref="scene" id="scene" onMouseDown={this.handleMouseDown} />;
  }
}
