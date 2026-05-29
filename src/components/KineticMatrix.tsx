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
  const [isCompromised, setIsCompromised] = useState(false);

  // Fallback defaults if params aren't loaded yet
  const gravity = params?.gravityMultiplier ?? 1.0;
  const restitution = params?.restitution ?? 0.5;
  const density = params?.payloadDensity ?? 1.0;

  useEffect(() => {
    if (!sceneRef.current) return;

    // 1. Initialize Matter Modules
    const Engine = Matter.Engine;
    const Render = Matter.Render;
    const World = Matter.World;
    const Bodies = Matter.Bodies;
    const Runner = Matter.Runner;
    const Composite = Matter.Composite;

    const engine = Engine.create({
      gravity: { y: gravity * 1.0 }
    });
    engineRef.current = engine;

    // 2. Setup Render Container
    const width = sceneRef.current.clientWidth || 600;
    const height = 400;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: width,
        height: height,
        wireframes: false,
        background: "#0a0a0a"
      }
    });
    renderRef.current = render;

    // 3. Build Static Ground and Walls
    const ground = Bodies.rectangle(width / 2, height - 10, width, 20, { 
      isStatic: true,
      render: { fillStyle: "#1a1a1a" }
    });

    // 4. Construct a Vulnerable Structural Tower
    const structuralBlocks: Matter.Body[] = [];
    const blockWidth = 40;
    const blockHeight = 60;
    const startX = width / 2;
    const startY = height - 20 - blockHeight / 2;

    // Stack layers of blocks
    for (let layer = 0; layer < 4; layer++) {
      const yPos = startY - (layer * blockHeight);
      if (layer % 2 === 0) {
        // Two vertical pillars
        structuralBlocks.push(Bodies.rectangle(startX - 45, yPos, blockWidth, blockHeight, {
          render: { fillStyle: "#262626", strokeStyle: "#404040", lineWidth: 1 }
        }));
        structuralBlocks.push(Bodies.rectangle(startX + 45, yPos, blockWidth, blockHeight, {
          render: { fillStyle: "#262626", strokeStyle: "#404040", lineWidth: 1 }
        }));
      } else {
        // Horizontal lintel beam bridging pillars
        structuralBlocks.push(Bodies.rectangle(startX, yPos + 15, 150, 30, {
          render: { fillStyle: "#3f3f46", strokeStyle: "#52525b", lineWidth: 1 }
        }));
      }
    }

    // Add everything to the simulation world
    World.add(engine.world, [ground, ...structuralBlocks]);

    // 5. Start Engine Runner Loops
    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);
    Render.run(render);

    // 6. Monitor Structural Integrity State
    const checkState = setInterval(() => {
      const allBodies = Composite.allBodies(engine.world);
      setActiveBodies(allBodies.length - 1); // Exclude ground plane

      // If any block moves significantly or tumbles downward, state goes compromised
      let broken = false;
      for (const body of allBodies) {
        if (!body.isStatic && (Math.abs(body.angle) > 0.4 || body.position.y > height - 40)) {
          // Detect variance from initial standing position
          if (body.position.x < startX - 100 || body.position.x > startX + 100) {
            broken = true;
          }
        }
      }
      setIsCompromised(broken);
    }, 200);

    // Clean up pipeline when component unmounts
    return () => {
      clearInterval(checkState);
      Render.stop(render);
      Runner.stop(runner);
      World.clear(engine.world, false);
      Engine.clear(engine);
      if (render.canvas) render.canvas.remove();
    };
  }, [gravity]);

  // Spawn the impactor node directly using the server metrics
  const executeImpact = () => {
    if (!engineRef.current) return;
    
    const width = sceneRef.current?.clientWidth || 600;
    const payload = Matter.Bodies.rectangle(width / 2, 40, 50, 50, {
      restitution: restitution,
      density: density * 0.001, // Scale down to fit Matter's engine mass limits
      render: { fillStyle: "#ef4444" }
    });

    // Apply immediate downforce velocity vector
    Matter.Body.setVelocity(payload, { x: 0, y: 5 });
    Matter.World.add(engineRef.current.world, payload);
  };

  // Re-instantiate layout back to baseline values
  const resetMatrix = () => {
    window.location.reload(); 
  };

  return (
    <div className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-4 space-y-4 font-sans">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
        <div>
          <h3 className="text-sm font-semibold tracking-wider text-neutral-200 uppercase">Kinetic Stress Testing Matrix</h3>
          <p className="text-xs text-neutral-500">Live Client Evaluation Engine Pipeline</p>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <div>
            <span className="text-neutral-500">Active Nodes:</span>{" "}
            <span className="font-mono text-neutral-300">{activeBodies}</span>
          </div>
          <div>
            <span className="text-neutral-500">Status:</span>{" "}
            <span className={`font-bold tracking-wide uppercase ${isCompromised ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
              {isCompromised ? "Compromised" : "Stable Matrix"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-neutral-900/50 p-2 rounded text-center text-xs font-mono">
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

      <div ref={sceneRef} className="w-full h-[400px] overflow-hidden rounded border border-neutral-800 bg-neutral-950" />

      <div className="flex gap-2">
        <button
          onClick={executeImpact}
          className="flex-1 bg-red-950 text-red-400 border border-red-800 hover:bg-red-900/50 transition-colors py-2 text-xs font-semibold rounded uppercase tracking-wider"
        >
          Execute Kinetic Impact
        </button>
        <button
          onClick={resetMatrix}
          className="px-4 bg-neutral-900 text-neutral-400 border border-neutral-800 hover:bg-neutral-800 transition-colors py-2 text-xs font-semibold rounded uppercase tracking-wider"
        >
          Reset
        </button>
      </div>
    </div>
  );
}