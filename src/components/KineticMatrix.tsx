"use client";

import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

interface KineticMatrixProps {
  params: {
    gravityMultiplier: number;
    restitution: number;
    payloadDensity: number;
  } | null;
}

export default function KineticMatrix({ params }: KineticMatrixProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  
  const [activeBodies, setActiveBodies] = useState(0);
  const [systemStress, setSystemStress] = useState("NOMINAL");

  // Fallback defaults
  const gravity = params?.gravityMultiplier ?? 1.0;
  const restitution = params?.restitution ?? 0.5;
  const density = params?.payloadDensity ?? 1.0;

  useEffect(() => {
    if (!sceneRef.current) return;

    // 1. Initialize Matter Modules
    const { Engine, Render, Runner, World, Bodies, Composite, Composites, Constraint, Mouse, MouseConstraint, Events, Body } = Matter;

    const engine = Engine.create({
      gravity: { y: gravity * 1.0 }
    });
    engineRef.current = engine;

    const width = sceneRef.current.clientWidth || 600;
    const height = 400;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: width,
        height: height,
        wireframes: false,
        background: "#0a0a0a",
        hasBounds: true
      }
    });
    renderRef.current = render;

    // 2. Build Environmental Anchors (Static)
    const ground = Bodies.rectangle(width / 2, height + 25, width * 2, 50, { 
      isStatic: true, render: { fillStyle: "#1a1a1a" } 
    });
    const leftPillar = Bodies.rectangle(50, height - 100, 100, 250, { 
      isStatic: true, render: { fillStyle: "#1a1a1a" } 
    });
    const rightPillar = Bodies.rectangle(width - 50, height - 100, 100, 250, { 
      isStatic: true, render: { fillStyle: "#1a1a1a" } 
    });

    // 3. Procedural Suspension Bridge Mesh
    const group = Body.nextGroup(true);
    const bridgeSegments = 12;
    const segmentWidth = (width - 200) / bridgeSegments;
    
    const bridge = Composites.stack(100, height - 200, bridgeSegments, 1, 0, 0, (x: number, y: number) => {
      return Bodies.rectangle(x, y, segmentWidth, 20, { 
        collisionFilter: { group: group },
        render: { fillStyle: "#3f3f46" },
        density: 0.05
      });
    });

    // Chain the segments together with constraints
    Composites.chain(bridge, 0.45, 0, -0.45, 0, { 
      stiffness: 0.9, 
      length: 2,
      render: { visible: true, strokeStyle: "#52525b" } 
    });

    // Anchor the bridge to the static pillars
    const leftAnchor = Constraint.create({ 
      pointA: { x: 100, y: height - 200 }, 
      bodyB: bridge.bodies[0], 
      pointB: { x: -segmentWidth / 2, y: 0 },
      stiffness: 0.9 
    });
    const rightAnchor = Constraint.create({ 
      pointA: { x: width - 100, y: height - 200 }, 
      bodyB: bridge.bodies[bridge.bodies.length - 1], 
      pointB: { x: segmentWidth / 2, y: 0 },
      stiffness: 0.9 
    });

    World.add(engine.world, [ground, leftPillar, rightPillar, bridge, leftAnchor, rightAnchor]);

    // 4. INTERACTIVITY: Add Mouse Constraints (Drag & Drop)
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });
    World.add(engine.world, mouseConstraint);
    render.mouse = mouse;

    // Prevent scrolling when interacting with the canvas
    mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
    mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);

    // 5. LIVE STRESS HEATMAP ENGINE
    Events.on(engine, 'beforeUpdate', () => {
      let maxVelocity = 0;
      const bodies = Composite.allBodies(engine.world);
      
      bodies.forEach(body => {
        if (!body.isStatic && body.label !== "Payload") {
          // Calculate kinetic stress based on speed and rotation
          const stress = Math.min((body.speed * 0.2) + (Math.abs(body.angularVelocity) * 2), 1);
          
          if (stress > maxVelocity) maxVelocity = stress;

          // Color Shift: Cool Gray -> Yellow -> Red
          const r = Math.floor(63 + (192 * stress));
          const g = Math.floor(63 + (192 * stress * (1 - stress) * 4)); 
          const b = Math.floor(70 - (70 * stress));
          
          body.render.fillStyle = `rgb(${r},${g},${b})`;
        }
      });

      // Update UI Telemetry
      setActiveBodies(bodies.length - 3); // Ignore static anchors
      if (maxVelocity > 0.8) setSystemStress("CRITICAL WARN");
      else if (maxVelocity > 0.3) setSystemStress("LOAD SHIFT");
      else setSystemStress("NOMINAL");
    });

    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);
    Render.run(render);

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      World.clear(engine.world, false);
      Engine.clear(engine);
      if (render.canvas) render.canvas.remove();
    };
  }, [gravity]);

  // Drop a dynamic, weighted payload onto the structure
  const executeImpact = () => {
    if (!engineRef.current || !sceneRef.current) return;
    
    const width = sceneRef.current.clientWidth || 600;
    const payload = Matter.Bodies.polygon(width / 2, 0, Math.floor(Math.random() * 3) + 4, 30 + (density * 10), {
      label: "Payload",
      restitution: restitution,
      density: density * 0.05, 
      render: { fillStyle: "#6366f1", strokeStyle: "#ffffff", lineWidth: 2 } // Indigo drop block
    });

    Matter.Body.setVelocity(payload, { x: (Math.random() - 0.5) * 5, y: 10 });
    Matter.World.add(engineRef.current.world, payload);
  };

  const resetMatrix = () => {
    window.location.reload(); 
  };

  return (
    <div className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-4 space-y-4 font-sans relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
      
      <div className="flex justify-between items-center border-b border-neutral-800 pb-2 relative z-10">
        <div>
          <h3 className="text-sm font-semibold tracking-wider text-cyan-400 uppercase">Kinetic Procedural Mesh</h3>
          <p className="text-xs text-neutral-500">Live Client Evaluation Engine Pipeline</p>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <div>
            <span className="text-neutral-500">Nodes:</span>{" "}
            <span className="font-mono text-neutral-300">{activeBodies}</span>
          </div>
          <div>
            <span className="text-neutral-500">Stress:</span>{" "}
            <span className={`font-bold tracking-wide uppercase ${
              systemStress === "CRITICAL WARN" ? "text-red-500 animate-pulse" : 
              systemStress === "LOAD SHIFT" ? "text-yellow-400" : "text-emerald-400"
            }`}>
              {systemStress}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-neutral-900/50 p-2 rounded text-center text-xs font-mono relative z-10">
        <div className="border-r border-neutral-800">
          <div className="text-neutral-500">Gravity Scalar</div>
          <div className="text-neutral-200 font-bold">{gravity.toFixed(2)}x</div>
        </div>
        <div className="border-r border-neutral-800">
          <div className="text-neutral-500">Restitution Coefficient</div>
          <div className="text-neutral-200 font-bold">{restitution.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-neutral-500">Target Mass Scale</div>
          <div className="text-neutral-200 font-bold">{density.toFixed(2)}ρ</div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute top-2 left-2 bg-black/60 text-neutral-400 px-2 py-1 rounded text-[9px] uppercase tracking-widest font-bold z-10 pointer-events-none border border-neutral-800">
          Mouse Control Enabled
        </div>
        <div ref={sceneRef} className="w-full h-[400px] overflow-hidden rounded border border-neutral-800 bg-[#0a0a0a] cursor-grab active:cursor-grabbing" />
      </div>

      <div className="flex gap-2 relative z-10">
        <button
          onClick={executeImpact}
          className="flex-1 bg-cyan-950 text-cyan-400 border border-cyan-800 hover:bg-cyan-900/50 transition-colors py-2 text-xs font-semibold rounded uppercase tracking-wider shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
        >
          Drop Stress Payload
        </button>
        <button
          onClick={resetMatrix}
          className="px-6 bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white transition-colors py-2 text-xs font-semibold rounded uppercase tracking-wider"
        >
          Reset
        </button>
      </div>
    </div>
  );
}