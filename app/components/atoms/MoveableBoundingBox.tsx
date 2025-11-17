import { useRef, useState } from "react";
import Moveable from "react-moveable";

interface MoveableBoundingBoxProps {

}

export default function MoveableBoundingBox({}:MoveableBoundingBoxProps){
    const targetRef = useRef<HTMLDivElement>(null);
    const [frame, setFrame] = useState({
        translate: [0, 0],
        width: 72,
        height: 240,
    });

    return (
    <div className="relative w-full h-full">
      <div
        ref={targetRef}
        id="boundingBox1"
        className="absolute border-2 border-blue-500 cursor-pointer"
        style={{
          transform: `translate(${frame.translate[0]}px, ${frame.translate[1]}px)`,
          width: `${frame.width}px`,
          height: `${frame.height}px`,
          backgroundColor: "rgba(0, 0, 255, 0.1)",
        }}
      />
      <Moveable
        target={targetRef}
        draggable
        resizable
        throttleDrag={0}
        throttleResize={0}
        onDrag={({ beforeTranslate }) => {
          setFrame((f) => ({ ...f, translate: beforeTranslate }));
        }}
        onResize={({ width, height, drag }) => {
          setFrame({
            translate: drag.beforeTranslate,
            width,
            height,
          });
        }}
        keepRatio={false}
        edge={false}
        bounds={{
          left: 0,
          top: 0,
          right: 800, // reemplazá por el tamaño real de tu contenedor
          bottom: 600,
        }}
      />
    </div>
  );
}