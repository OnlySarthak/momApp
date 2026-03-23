const meeting = require("../../models/meeting.model");
const teamMember = require("../../models/teamMember.model");
const ai = require("../../utils/aiClient"); // hypothetical AI client wrapper
const task = require("../../models/task.model");
const mom = require("../../models/mom.model");
const task = require("../../models/task.model");
const teamstats = require("../../models/teamStats.model");

const startMeetingProcessingInBackground = async (meetingId, audioFileUrl) => {
    try {
        //prepare prompt
        const prompt = generatePrompt(meetingId);

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
            {
                role: "user",
                parts: [
                    {
                        text: prompt,
                    },
                    {
                        fileData: {
                            mimeType: "audio/mpeg", // ⚠️ change based on file type
                            fileUri: audioFileUrl,  // S3 URL
                        },
                    },
                ],
            },
            ],
        });

        //further operations like saving MoM, tasks, decisions to DB based on response
        postProccessMeetingOperations(meetingId, response);
    }
    catch (error) {
        console.error("Error processing meeting:", error);
        //update meeting processing stage to "failed"
        await meeting.findByIdAndUpdate(
            meetingId,
            { processingStage: "failed" },  
            { new: true }
        );
    }   
};

const postProccessMeetingOperations = async (meetingId, aiResponse) => {
    try {
        //parse aiResponse
            const { summary, key_decisions, tasks, team_stats, active_member_ids } = JSON.parse(aiResponse.contents[0].parts[0].text);

            //save MoM
            await mom.create({
                meetingId,
                summary,
                decisions: key_decisions,
                activeMemberIds: active_member_ids
            });

            //save tasks
            for (const taskGroup of tasks) {
                const { user_id, pending, in_progress, completed } = taskGroup;

                // Create tasks for each category
                for (const description of pending) {
                    await task.create({
                        meetingId,
                        userId: user_id,
                        description,
                        status: "pending"
                    });
                }
                for (const description of in_progress) {
                    await task.create({
                        meetingId,
                        userId: user_id,
                        description,
                        status: "in_progress"
                    });
                }
                for (const description of completed) {
                    await task.create({
                        meetingId,
                        userId: user_id,
                        description,
                        status: "completed"
                    });
                }
            }

            //save team stats
            await teamstats.create({
                meetingId,
                ...team_stats
            });

        // Further operations like saving MoM, tasks, decisions to DB
    } catch (error) {
        console.error("Error in post-processing meeting operations:", error);
    }
};

const generatePrompt = async (meetingId) => {   
    try {
        const meetingData = await meeting.findById(meetingId).populate("participants.id", "name");

        meetingData.participants = await Promise.all(meetingData.participants.map(async (p) => ({
            id: p.id._id.toString(),
            name: p.id.name,
            role: await teamMember.findOne({ userId : p.id._id}).select("functionalRole")
        })));

        if (!meetingData) {
            throw new Error("Meeting not found for prompt generation");
        }

        const buildPrompt = `
            You are an AI meeting assistant.

            You will receive:
            1. An audio file of a meeting
            2. Meeting details and participants

            ----------------------------
            MEETING DETAILS:
            Title: ${meetingData.title}

            Participants:
            ${meetingData.participants.map(p =>
            `- Name: ${p.name}, ID: ${p.id}, Role: ${p.role || "member"}`
            ).join("\n")}
            ----------------------------

            YOUR TASK:
            1. Transcribe and understand the meeting
            2. Generate a concise summary
            3. Extract key decisions
            4. Identify tasks and assign them to participants

            ----------------------------
            IMPORTANT RULES:
            - Use ONLY the provided participant IDs
            - DO NOT invent users
            - If unsure about assignment, skip that task
            - Group tasks by user
            - Classify each task into:
            - pending
            - in_progress
            - completed
            - Count total tasks for team_stats
            - Identify active participants (who spoke or were assigned tasks)

            ----------------------------
            RETURN STRICT JSON ONLY (NO TEXT, NO EXPLANATION):

            {
            "summary": "string",
            "key_decisions": ["string"],
            "tasks": [
                {
                "user_id": "string",
                "pending": ["string"],
                "in_progress": ["string"],
                "completed": ["string"]
                }
            ],
            "team_stats": {
                "totalTasks": number,
                "completedTasks": number,
                "pendingTasks": number,
                "inProgressTasks": number
            },
            "active_member_ids": ["string"]
            }

            ----------------------------
            STRICT OUTPUT RULES:
            - Always return valid JSON
            - No extra text before or after JSON
            - Use empty arrays if no data
            - All IDs must match given participants
            `;

        return buildPrompt(meetingData);
    }
    catch (error) {
        console.error("Error generating prompt:", error);
        throw error;
    }
};
