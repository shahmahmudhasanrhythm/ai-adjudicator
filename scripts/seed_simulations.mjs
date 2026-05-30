import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load your environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use the service role key to bypass RLS
);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

// --- THE SIMULATION DATASET ---
const blueprints = [
  {
    scenario_name: "Basic Payload Drop",
    description: "A heavy target block falling onto a static ground plane. Used for testing gravity and direct impact density.",
    blueprint_json: {
      scenarioName: "Basic Payload Drop",
      environment: { gravity: 1.5 },
      bodies: [
        { id: "ground", type: "rectangle", x: 300, y: 410, w: 800, h: 60, isStatic: true },
        { id: "target", type: "rectangle", x: 300, y: 200, w: 50, h: 50, isStatic: false, density: 0.5 }
      ],
      constraints: []
    }
  },
  {
    scenario_name: "Kinetic Wrecking Ball",
    description: "A heavy spherical pendulum swinging into a stacked wall of rectangular blocks. Tests kinetic energy transfer, structural impact resistance, and anchor constraints.",
    blueprint_json: {
      scenarioName: "Kinetic Wrecking Ball Impact",
      environment: { gravity: 1.0 },
      bodies: [
        { id: "ground", type: "rectangle", x: 300, y: 390, w: 800, h: 40, isStatic: true },
        { id: "anchor", type: "rectangle", x: 150, y: 50, w: 20, h: 20, isStatic: true },
        { id: "ball", type: "circle", x: 50, y: 250, r: 25, isStatic: false, density: 0.8, restitution: 0.2 },
        // Wall blocks
        { id: "b1", type: "rectangle", x: 400, y: 350, w: 30, h: 40, isStatic: false, density: 0.1 },
        { id: "b2", type: "rectangle", x: 400, y: 310, w: 30, h: 40, isStatic: false, density: 0.1 },
        { id: "b3", type: "rectangle", x: 400, y: 270, w: 30, h: 40, isStatic: false, density: 0.1 },
        { id: "b4", type: "rectangle", x: 400, y: 230, w: 30, h: 40, isStatic: false, density: 0.1 }
      ],
      constraints: [
        { bodyAId: "anchor", bodyBId: "ball", stiffness: 0.9, length: 220 }
      ]
    }
  },
  {
    scenario_name: "Suspension Truss Bridge",
    description: "A flexible suspension bridge supported by two static pillars. Tests load distribution, tension constraints, and structural sagging under weight.",
    blueprint_json: {
      scenarioName: "Flexible Suspension Truss",
      environment: { gravity: 1.2 },
      bodies: [
        { id: "ground", type: "rectangle", x: 300, y: 410, w: 800, h: 60, isStatic: true },
        { id: "left_pillar", type: "rectangle", x: 100, y: 300, w: 40, h: 200, isStatic: true },
        { id: "right_pillar", type: "rectangle", x: 500, y: 300, w: 40, h: 200, isStatic: true },
        // Bridge Segments
        { id: "seg1", type: "rectangle", x: 150, y: 200, w: 50, h: 15, isStatic: false, density: 0.05 },
        { id: "seg2", type: "rectangle", x: 210, y: 200, w: 50, h: 15, isStatic: false, density: 0.05 },
        { id: "seg3", type: "rectangle", x: 270, y: 200, w: 50, h: 15, isStatic: false, density: 0.05 },
        { id: "seg4", type: "rectangle", x: 330, y: 200, w: 50, h: 15, isStatic: false, density: 0.05 },
        { id: "seg5", type: "rectangle", x: 390, y: 200, w: 50, h: 15, isStatic: false, density: 0.05 },
        { id: "seg6", type: "rectangle", x: 450, y: 200, w: 50, h: 15, isStatic: false, density: 0.05 }
      ],
      constraints: [
        { bodyAId: "left_pillar", bodyBId: "seg1", stiffness: 0.8, length: 40 },
        { bodyAId: "seg1", bodyBId: "seg2", stiffness: 0.8, length: 60 },
        { bodyAId: "seg2", bodyBId: "seg3", stiffness: 0.8, length: 60 },
        { bodyAId: "seg3", bodyBId: "seg4", stiffness: 0.8, length: 60 },
        { bodyAId: "seg4", bodyBId: "seg5", stiffness: 0.8, length: 60 },
        { bodyAId: "seg5", bodyBId: "seg6", stiffness: 0.8, length: 60 },
        { bodyAId: "seg6", bodyBId: "right_pillar", stiffness: 0.8, length: 40 }
      ]
    }
  },
  {
    scenario_name: "Structural Pyramid Collapse",
    description: "A wide pyramid of blocks subjected to top-down weight. Tests load distribution, base friction, and lateral shear forces.",
    blueprint_json: {
      scenarioName: "Load Distribution Pyramid",
      environment: { gravity: 1.5 },
      bodies: [
        { id: "ground", type: "rectangle", x: 300, y: 390, w: 800, h: 40, isStatic: true },
        // Base
        { id: "p1", type: "rectangle", x: 200, y: 350, w: 40, h: 40, isStatic: false },
        { id: "p2", type: "rectangle", x: 250, y: 350, w: 40, h: 40, isStatic: false },
        { id: "p3", type: "rectangle", x: 300, y: 350, w: 40, h: 40, isStatic: false },
        { id: "p4", type: "rectangle", x: 350, y: 350, w: 40, h: 40, isStatic: false },
        { id: "p5", type: "rectangle", x: 400, y: 350, w: 40, h: 40, isStatic: false },
        // Layer 2
        { id: "p6", type: "rectangle", x: 225, y: 310, w: 40, h: 40, isStatic: false },
        { id: "p7", type: "rectangle", x: 275, y: 310, w: 40, h: 40, isStatic: false },
        { id: "p8", type: "rectangle", x: 325, y: 310, w: 40, h: 40, isStatic: false },
        { id: "p9", type: "rectangle", x: 375, y: 310, w: 40, h: 40, isStatic: false },
        // Layer 3
        { id: "p10", type: "rectangle", x: 250, y: 270, w: 40, h: 40, isStatic: false },
        { id: "p11", type: "rectangle", x: 300, y: 270, w: 40, h: 40, isStatic: false },
        { id: "p12", type: "rectangle", x: 350, y: 270, w: 40, h: 40, isStatic: false },
        // Peak
        { id: "p13", type: "rectangle", x: 275, y: 230, w: 40, h: 40, isStatic: false },
        { id: "p14", type: "rectangle", x: 325, y: 230, w: 40, h: 40, isStatic: false },
        { id: "p15", type: "rectangle", x: 300, y: 190, w: 40, h: 40, isStatic: false },
        // Heavy anvil falling on top
        { id: "anvil", type: "polygon", x: 300, y: 50, sides: 6, r: 40, isStatic: false, density: 2.0 }
      ],
      constraints: []
    }
  }
];

async function seedSimulations() {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" }); // Updated to correct model!

  console.log("Starting simulation pipeline ingestion...");

  for (const blueprint of blueprints) {
    try {
      // 1. Generate the embedding for the description
      const result = await model.embedContent(blueprint.description);
      const embedding = result.embedding.values;

      // 2. Insert into Supabase
      const { data, error } = await supabase
        .from('simulation_registry')
        .insert({
          scenario_name: blueprint.scenario_name,
          description: blueprint.description,
          blueprint_json: blueprint.blueprint_json,
          embedding: embedding
        });

      if (error) {
        console.error(`Error inserting ${blueprint.scenario_name}:`, error.message);
      } else {
        console.log(`Success: [${blueprint.scenario_name}] structurally indexed to Supabase.`);
      }
    } catch (err) {
      console.error(`Failed to process ${blueprint.scenario_name}:`, err);
    }
  }
  
  console.log("Ingestion complete.");
}

seedSimulations();