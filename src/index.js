import { processAudio } from "./processAudio.js";

async function main() {
  try {
    const result = await processAudio("./meeting.mp3");
    console.log("✅ RESULT:\n", result);
  } catch (err) {
    console.error("❌ ERROR:", err);
  }
}

main();