import { CinematicPipelineBuilder } from './CinematicPipelineBuilder.js';

// 1. Build the Pipeline
const script = "In a neon-lit cyberpunk city, a rogue android named Kael discovers a hidden garden on a skyscraper rooftop. He touches a real flower for the first time, triggering a memory of his creator.";
const graph = CinematicPipelineBuilder.buildStandardPipeline(script);

// 2. Serialize to JSON
const jsonOutput = JSON.stringify(graph, (key, value) => {
  if (value instanceof Map) {
    return Object.fromEntries(value);
  }
  return value;
}, 2);

console.log(jsonOutput);
