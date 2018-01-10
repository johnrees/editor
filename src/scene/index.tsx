import * as THREE from "three";
import * as React from "react";
import * as Rx from "rxjs/Rx";
import camera from "./components/camera";
import model from "./components/model";
import renderer from "./components/renderer";
import zoom from "./interactions/zoom";
import isEqual from "lodash/isEqual";
import { facesHash } from "@bentobots/three";
import { getPosition, nearlyEqual, flatten } from "./utils";
import { extrudeVertices, setPlaneAndOriginalVertices } from "./interactions/extrude";

const RENDER_THROTTLE = 25;

interface IProps {
  width: number;
  height: number;
  bgColor: string | number;
}

export default class Scene extends React.PureComponent<IProps> {
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private model;
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

    const raycaster: THREE.Raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane();
    const planeIntersection = new THREE.Vector3();
    // const faceOutline = new THREE.Line(
    //   new THREE.Geometry(),
    //   new THREE.LineBasicMaterial({ color: 0xffffff })
    // );
    const faceOutline = new THREE.Mesh(
      new THREE.Geometry(),
      new THREE.MeshBasicMaterial({color: 0xFFFFFF, side: THREE.DoubleSide})
    )
    this.scene.add(faceOutline);

    // const click$ = Rx.Observable.fromEvent(domElement, "click");

    const mouseDown$ = Rx.Observable.fromEvent(domElement, "mousedown");

    const mouseUp$ = Rx.Observable.fromEvent(document.body, "mouseup");

    const mouseMove$ = Rx.Observable.fromEvent(domElement, "mousemove")
      .throttleTime(30)
      .map(({ clientX, clientY }) =>
        getPosition(clientX, clientY, this.props.width, this.props.height)
      );

    const wheel$ = Rx.Observable.fromEvent(el, "wheel", {
      passive: true
    });

    const zoom$ = zoom(wheel$, this.camera);

    const intersections$ = mouseMove$
      .map(([x, y]) => {
        raycaster.setFromCamera({ x, y }, this.camera);
        return raycaster.intersectObject(this.model);
      })
      .startWith([])
      .share()

    const mouseOverModel$ = intersections$
      .filter(intersections => intersections.length > 0)
      .map(intersections => intersections[0])
      .share()

    const activeModelFaces$ = mouseOverModel$
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

    const activeModelVertices$ = mouseOverModel$
      .withLatestFrom(activeModelFaces$)
      .map(([intersection, faces]) => {
        const object = intersection.object as THREE.Mesh;
        const geometry = object.geometry as THREE.Geometry;
        return [...new Set(flatten(
          faces.map(f => {
            return [
              geometry.vertices[f.a],
              geometry.vertices[f.b],
              geometry.vertices[f.c]
            ];
          })
        ))]
      })
      .distinctUntilChanged(isEqual)

    const extrude$ = mouseDown$
      .withLatestFrom(intersections$)
      .filter(([_, intersections]) => intersections.length > 0)
      .withLatestFrom(activeModelVertices$)
      .switchMap(setPlaneAndOriginalVertices(plane, mouseMove$, faceOutline))
      .switchMap(extrudeVertices(raycaster, plane, planeIntersection))
      .takeUntil(mouseUp$)
      .repeat()

    const render$ = Rx.Observable.merge(extrude$, zoom$)
      .throttleTime(RENDER_THROTTLE)

    render$
      .subscribe(_ => {
        console.log(_);
        requestAnimationFrame(() =>
          this.renderer.render(this.scene, this.camera)
        );
      });
  }

  render() {
    return <div ref="scene" id="scene" />;
  }
}
