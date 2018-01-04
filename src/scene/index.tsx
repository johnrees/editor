import * as THREE from "three";
import * as React from "react";
import camera from "./components/camera";
import model from "./components/model";
import renderer from "./components/renderer";
import * as Rx from "rxjs/Rx";
import { getPosition, nearlyEqual, flatten } from "./utils";
import zoom from "./interactions/zoom";
import { facesHash } from "@bentobots/three";

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

    /**
     * Attach event listeners
     */

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

    /**
     * Make streams
     */

    // zooming

    const zoom$ = zoom(wheel$, this.camera);

    // mouseover

    const intersections$ = mouseMove$
      .throttleTime(20)
      .map(([x, y]) => {
        this.raycaster.setFromCamera({ x, y }, this.camera);
        return this.raycaster.intersectObject(this.model);
      })
      .startWith([])
      .partition(arr => arr.length <= 0);

    const offModel$ = intersections$[0]
      .do(_ => {
        // console.log('off')
        faceOutline.visible = false;
      })
      .map(() => false);

    const overModel$ = intersections$[1]
      .do(_ => {
        // console.log('on')
        faceOutline.visible = true;
      })
      .map(arr => arr[0]);

    const hoverState$ = Rx.Observable.merge(
      offModel$,
      overModel$
    ).distinctUntilChanged();

    const activeFaces$ = hoverState$
      .map((intersection: THREE.Intersection) => {
        if (intersection) {
          // plane.setFromNormalAndCoplanarPoint(
          //   intersection.face.normal,
          //   intersection.point
          // )
          return (this.model.geometry as THREE.Geometry).faces.filter(face =>
            nearlyEqual(face.normal, intersection.face.normal)
          );
        } else {
          return [];
        }
      })
      .distinctUntilChanged((x, y) => facesHash(x) === facesHash(y));

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
        faceOutline.visible = true;
        faceOutline.geometry.dispose();
        faceOutline.geometry = new THREE.Geometry();
        faceOutline.geometry.vertices = vertices;

        faceOutline.geometry.mergeVertices();
        return {
          // normal: faces[0].normal.clone().normalize(),
          vertices: faceOutline.geometry.vertices
        };
      })
      .share();

    activeVertices$
      .filter(v => v.vertices.length > 0)
      .concatMap(sm => {
        return mouseDown$.switchMap(vs => {
          console.log("mouse down!");
          return mouseMove$;
        });
      })
      .takeUntil(mouseUp$)
      .repeat()
      .subscribe(console.log);

    const render$ = Rx.Observable.merge(activeVertices$, zoom$)
      .throttleTime(20)
      .subscribe(_ => {
        console.log(_, "rendering");
        requestAnimationFrame(() =>
          this.renderer.render(this.scene, this.camera)
        );
      });
  }

  render() {
    return <div ref="scene" id="scene" />;
  }
}
