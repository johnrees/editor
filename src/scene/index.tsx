import * as THREE from "three";
import * as React from "react";
import camera from "./components/camera";
import model from "./components/model";
import renderer from "./components/renderer";
import * as Rx from "rxjs/Rx";
import { getPosition, nearlyEqual, flatten } from "./utils";

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
    this.renderer = renderer(width, height, bgColor);
    this.model = model([[-2, 0], [-2, 2.5], [0, 3.6], [2, 2.5], [2, 0]]);

    this.scene.add(this.model);

    this.render3D = this.render3D.bind(this);
  }

  render3D() {
    console.log("render");
    this.renderer.render(this.scene, this.camera);
  }

  componentDidMount() {
    const { domElement } = this.renderer;
    const el = this.refs.scene as HTMLDivElement;
    el.appendChild(domElement);

    const faceOutline = new THREE.Line(
      new THREE.Geometry(),
      new THREE.LineBasicMaterial({ color: 0xffffff })
    );
    this.scene.add(faceOutline);

    // add event listeners

    const click$ = Rx.Observable.fromEvent(domElement, "click");

    const mouseMove$ = Rx.Observable.fromEvent(domElement, "mousemove")
      .throttleTime(50)
      .map(({ clientX, clientY }) =>
        getPosition(clientX, clientY, this.props.width, this.props.height)
      );

    const mouseWheel$ = Rx.Observable.fromEvent(el, "mousewheel", {
      passive: true
    });

    // connect streams

    const intersections$ = mouseMove$
      .flatMap(([x, y]) => {
        this.raycaster.setFromCamera({ x, y }, this.camera);
        return this.raycaster.intersectObject(this.model);
      })
      .share();

    const activeFaces$ = intersections$
      .map((intersection: THREE.Intersection) => {
        return (this.model.geometry as THREE.Geometry).faces.filter(face =>
          nearlyEqual(face.normal, intersection.face.normal)
        );
      })
      .distinctUntilChanged((f: THREE.Face3[], q: THREE.Face3[]) => {
        // only continue if faces are pointing in a different direction
        return f[0].normal === q[0].normal;
      });

    const activeVertices$ = activeFaces$
      .map((faces: THREE.Face3[]) => {
        const vertices = flatten(
          faces.map(f => {
            return [
              this.model.geometry.vertices[f.a],
              this.model.geometry.vertices[f.b],
              this.model.geometry.vertices[f.c]
            ];
          })
        );
        faceOutline.geometry.dispose();
        faceOutline.geometry = new THREE.Geometry();
        faceOutline.geometry.vertices = vertices;
        faceOutline.geometry.mergeVertices();
        return faceOutline.geometry.vertices;
      })
      .share();

    // prettier-ignore
    activeVertices$
      // .do(console.log)
      .subscribe(() => {
        requestAnimationFrame(this.render3D);
      });

    activeVertices$.sample(click$).subscribe(vertices => {
      console.log("EXTRUDE");
      vertices.forEach(v => v.addScalar(0.1));
      const geometry = this.model.geometry as THREE.Geometry;
      geometry.verticesNeedUpdate = true;
      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();
      geometry.computeFlatVertexNormals();

      requestAnimationFrame(this.render3D);
    });

    mouseWheel$
      .throttleTime(20)
      .pluck("deltaY")
      .subscribe(console.log);

    requestAnimationFrame(this.render3D);
  }

  render() {
    return <div ref="scene" id="scene" />;
  }
}
