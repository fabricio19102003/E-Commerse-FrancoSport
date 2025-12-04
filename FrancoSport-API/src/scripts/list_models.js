import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function listModelsRest() {
  console.log("Fetching models via REST API...");
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.error("REST API Error:", data);
      return;
    }
    
    console.log("Available Models:");
    if (data.models) {
      data.models.forEach(m => {
        console.log(`- ${m.name} (${m.supportedGenerationMethods.join(", ")})`);
      });
    } else {
      console.log("No models found in response.");
    }
  } catch (error) {
    console.error("Fetch Error:", error);
  }
}

listModelsRest();
