export default function zoom(wheel$, camera) {
  return (
    wheel$
      // .do((we: WheelEvent) => console.log(we.wheelDelta))
      .throttleTime(20)
      // .pluck("deltaY")
      .map((e: WheelEvent) =>
        Math.max(Math.min(camera.zoom + e.deltaY / 100, 2), 0.5)
      )
      .startWith(camera.zoom)
      .distinctUntilChanged()
      .do((delta: number) => {
        camera.zoom = delta;
        camera.updateProjectionMatrix();
      })
  );
}
