require("dotenv").config({ path: "backend/.env" });

async function listModels() {
  const response = await fetch(
    "https://api.groq.com/openai/v1/models",
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Groq error:", data);
    return;
  }

  console.log("\nAVAILABLE GROQ MODELS:\n");

  for (const model of data.data) {
    console.log(model.id);
  }
}

listModels();