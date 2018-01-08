import * as THREE from "three";
import * as React from "react";
import * as Rx from "rxjs/Rx";
import camera from "./components/camera";
import DebugPlane from "./components/debug_plane";
import model from "./components/model";
import renderer from "./components/renderer";
import zoom from "./interactions/zoom";
import isEqual from "lodash/isEqual";
import { facesHash } from "@bentobots/three";
import { extrude } from "./interactions/extrude";
import { getPosition, nearlyEqual, flatten } from "./utils";

const RENDER_THROTTLE = 30;

interface IProps {
  width: number;
  height: number;
  bgColor: string | number;
}

export default class Scene extends React.PureComponent<IProps> {
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
  }

  componentDidMount() {
    const { domElement } = this.renderer;
    const el = this.refs.scene as HTMLDivElement;
    el.appendChild(domElement);

    const plane = new THREE.Plane();
    const faceOutline = new THREE.Line(
      new THREE.Geometry(),
      new THREE.LineBasicMaterial({ color: 0xffffff })
    );
    this.scene.add(faceOutline);

    const click$ = Rx.Observable.fromEvent(domElement, "click");

    const mouseDown$ = Rx.Observable.fromEvent(domElement, "mousedown");

    const mouseUp$ = Rx.Observable.fromEvent(document.body, "mouseup");

    const mouseMove$ = Rx.Observable.fromEvent(domElement, "mousemove")
      .throttleTime(50)
      .map(({ clientX, clientY }) =>
        getPosition(clientX, clientY, this.props.width, this.props.height)
      );

    const wheel$ = Rx.Observable.fromEvent(el, "wheel", {
      passive: true
    });

    const zoom$ = zoom(wheel$, this.camera);

    const intersections$ = mouseMove$
      .throttleTime(20)
      .map(([x, y]) => {
        this.raycaster.setFromCamera({ x, y }, this.camera);
        return this.raycaster.intersectObject(this.model);
      })
      .startWith([])
      .share()

    const over$ = intersections$
      .filter(intersections => intersections.length > 0)
      .map(intersections => intersections[0])
      .share()

    const activeFaces$ = over$
      .map(intersection => {
        const {object, face} = intersection;
        if (object instanceof THREE.Mesh) {
          const geometry = object.geometry as THREE.Geometry;
          const faces = geometry.faces.filter(
            f => nearlyEqual(f.normal, face.normal)
          );
          return faces;
        }
      })
      .distinctUntilChanged(
        (x, y) => facesHash(x) === facesHash(y)
      )

    const activeVertices$ = over$
      .withLatestFrom(activeFaces$)
      .map(([intersection, faces]) => {
        const object = intersection.object as THREE.Mesh;
        const geometry = object.geometry as THREE.Geometry;
        return new Set(flatten(
          faces.map(f => {
            return [
              geometry.vertices[f.a],
              geometry.vertices[f.b],
              geometry.vertices[f.c]
            ];
          })
        ))
      })
      .distinctUntilChanged(isEqual)

    const extrude$ = mouseDown$
      .withLatestFrom(intersections$)
      .filter(([_, intersections]) => intersections.length > 0)
      .withLatestFrom(activeVertices$)
      .switchMap(extrude(mouseMove$))
      .takeUntil(mouseUp$)
      .repeat()

    const render$ = extrude$
      .throttleTime(RENDER_THROTTLE)
      .subscribe(_ => {
        console.log(_);
        requestAnimationFrame(() =>
          this.renderer.render(this.scene, this.camera)
        );
      });

    this.renderer.render(this.scene, this.camera)
  }

  render() {
    return <div ref="scene" id="scene" />;
  }
}
