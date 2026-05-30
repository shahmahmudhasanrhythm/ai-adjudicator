"use client";

import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

export interface SimulationBlueprint {
  scenarioName: string;
  environment: { gravity: number };
  bodies: Array<{
    id: string;
    type: "rectangle" | "circle" | "polygon";
    x: number; y: number;
    w?: number; h?: number; r?: number; sides?: number;
    isStatic: boolean;
    density?: number;
    restitution?: number;
  }>;
  constraints: Array<{
    bodyAId: string;
    bodyBId: string;
    stiffness?: number;
    length?: number;
  }>;
}

interface UniversalMatrixProps {
  blueprint: SimulationBlueprint | null;
}

export default function UniversalMatrix({ blueprint }: UniversalMatrixProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  
  const [activeBodies, setActiveBodies] = useState(0);
  const [systemStress, setSystemStress] = useState("NOMINAL");

  useEffect(() => {
    if (!sceneRef.current || !blueprint) return;

    const { Engine, Render, Runner, World, Bodies, Constraint, Mouse, MouseConstraint, Events, Composite } = Matter;

    const engine = Engine.create({
      gravity: { y: blueprint.environment.gravity }
    });
    engineRef.current = engine;

    const width = sceneRef.current.clientWidth || 600;
    const height = 400;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width, height,
        wireframes: false,
        background: "#0a0a0a",
      }
    });
    renderRef.current = render;

    const bodyMap = new Map<string, Matter.Body>();
    
    blueprint.bodies.forEach(b => {
      let matterBody;
      const options = {
        isStatic: b.isStatic,
        density: b.density || 0.001,
        restitution: b.restitution || 0,
        render: { fillStyle: b.isStatic ? "#1a1a1a" : "#3f3f46" }
      };

      if (b.type === "rectangle" && b.w && b.h) {
        matterBody = Bodies.rectangle(b.x, b.y, b.w, b.h, options);
      } else if (b.type === "circle" && b.r) {
        matterBody = Bodies.circle(b.x, b.y, b.r, options);
      } else if (b.type === "polygon" && b.sides && b.r) {
        matterBody = Bodies.polygon(b.x, b.y, b.sides, b.r, options);
      }

      if (matterBody) {
        bodyMap.set(b.id, matterBody);
        World.add(engine.world, matterBody);
      }
    });

    blueprint.constraints.forEach(c => {
      const bodyA = bodyMap.get(c.bodyAId);
      const bodyB = bodyMap.get(c.bodyBId);

      if (bodyA && bodyB) {
        const constraint = Constraint.create({
          bodyA, bodyB,
          stiffness: c.stiffness || 0.1,
          length: c.length || 50,
          render: { visible: true, strokeStyle: "#52525b" }
        });
        World.add(engine.world, constraint);
      }
    });

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    });
    World.add(engine.world, mouseConstraint);
    render.mouse = mouse;
    
    // --- TS FIX: Cast mouse to any to bypass the missing type definition ---
    const m = mouse as any;
    if (m.element && m.mousewheel) {
      m.element.removeEventListener("mousewheel", m.mousewheel);
      m.element.removeEventListener("DOMMouseScroll", m.mousewheel);
    }

    Events.on(engine, 'beforeUpdate', () => {
      let maxVelocity = 0;
      const allBodies = Composite.allBodies(engine.world);
      
      allBodies.forEach(body => {
        if (!body.isStatic) {
          const stress = Math.min((body.speed * 0.2) + (Math.abs(body.angularVelocity) * 2), 1);
          if (stress > maxVelocity) maxVelocity = stress;

          const r = Math.floor(63 + (192 * stress));
          const g = Math.floor(63 + (192 * stress * (1 - stress) * 4)); 
          const b = Math.floor(70 - (70 * stress));
          
          body.render.fillStyle = `rgb(${r},${g},${b})`;
        }
      });

      setActiveBodies(allBodies.length);
      if (maxVelocity > 0.8) setSystemStress("CRITICAL WARN");
      else if (maxVelocity > 0.3) setSystemStress("LOAD SHIFT");
      else setSystemStress("NOMINAL");
    });

    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      World.clear(engine.world, false);
      Engine.clear(engine);
      if (render.canvas) render.canvas.remove();
    };
  }, [blueprint]);

  if (!blueprint) return null;

  return (
    <div className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-4 space-y-4 font-sans relative mt-6 shadow-lg">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
        <div>
          <h3 className="text-sm font-semibold tracking-wider text-cyan-400 uppercase">{blueprint.scenarioName}</h3>
          <p className="text-xs text-neutral-500">Universal Physics Render Engine</p>
        </div>
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div><span className="text-neutral-500">Nodes:</span> <span className="text-neutral-300">{activeBodies}</span></div>
          <div><span className="text-neutral-500">Stress:</span> <span className={`font-bold ${systemStress === "CRITICAL WARN" ? "text-red-500 animate-pulse" : "text-emerald-400"}`}>{systemStress}</span></div>
        </div>
      </div>

      <div ref={sceneRef} className="w-full h-[400px] overflow-hidden rounded border border-neutral-800 bg-[#0a0a0a] cursor-grab active:cursor-grabbing relative">
         <div className="absolute top-2 left-2 bg-black/60 text-neutral-400 px-2 py-1 rounded text-[9px] uppercase tracking-widest font-bold z-10">
          Agent-Sourced Blueprint
        </div>
      </div>
    </div>
  );
}