const meeting = require("../../models/meeting.model");
const teamMember = require("../../models/teamMember.model");
const mom = require("../../models/mom.model");
const task = require("../../models/task.model");
const teamstats = require("../../models/teams.stats.model");
const { GoogleGenAI } = require("@google/genai");

exports.startMeetingProcessingInBackground = async (meetingId, audioFileUrl) => {
    try {
        //prepare prompt
        const prompt = await generatePrompt(meetingId);
        // console.log(prompt);


        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        });

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



        const aiText = response.candidates[0].content.parts[0].text;

        console.log("AI RAW TEXT:", aiText);

        //further operations like saving MoM, tasks, decisions to DB based on response
        postProccessMeetingOperations(meetingId, aiText);
    }
    catch (error) {
        console.error("Error processing meeting:", error);
        //update meeting processing stage to "failed"
        await meeting.findByIdAndUpdate(
            meetingId,
            { processingStage: "failed" },
            { returnDocument: "after" }
        );
    }
};

const postProccessMeetingOperations = async (meetingId, aiResponse) => {
    try {
        const { summary,
            decisions,
            tasks,
            team_stats,
        } = JSON.parse(aiResponse);

        //check if mom having meetingId already exists, if yes then update else create new
        const existingMoM = await mom.findOne({ meetingId });
        if (existingMoM) {
            throw new Error("MoM for this meeting already exists");
        }

        //save MoM
        const momSaved = await mom.create({
            meetingId,
            summary,
            decisions,
        });

        //save tasks
        for (const taskGroup of tasks) {
            const { user_id,
                responsibleName,
                responsibleFunctionalRole,
                pending, in_progress, completed } = taskGroup;

            for (const t of pending) {
                await task.create({
                    title: t,
                    responsibleId: user_id,
                    state: "pending",
                    momId: momSaved._id,
                    resposibleName: responsibleName,
                    // responsibleFunctionalRole: (responsibleFunctionalRole == "null") ? "other" : responsibleFunctionalRole
                });
            }

            for (const t of in_progress) {
                await task.create({
                    title: t,
                    responsibleId: user_id,
                    state: "in_progress",
                    momId: momSaved._id,
                    resposibleName: responsibleName,
                    // responsibleFunctionalRole: (responsibleFunctionalRole == "null") ? "other" : responsibleFunctionalRole
                });
            }

            for (const t of completed) {
                await task.create({
                    title: t,
                    responsibleId: user_id,
                    state: "completed",
                    momId: momSaved._id,
                    resposibleName: responsibleName,
                    
                });
            }

        }

        //save team stats
        await teamstats.findByIdAndUpdate(meetingId, {
            totalTasks: team_stats.totalTasks,
            completedTasks: team_stats.completedTasks,
            pendingTasks: team_stats.pendingTasks,
            inProgressTasks: team_stats.inProgressTasks,
        },
        { returnDocument: "after", upsert: true });

        console.log("Meeting post-processing completed successfully for meetingId:", meetingId);

        // Further operations like saving MoM, tasks, decisions to DB
    } catch (error) {
        console.error("Error in post-processing meeting operations:", error);
    }
};

const generatePrompt = async (meetingId) => {
    try {
        const meetingData = await meeting
            .findById(meetingId)
            .populate("participants.id", "name");



        // console.log("Fetched meeting data for prompt generation:", meetingData.participants);

        const participatantsWithRoles = await teamMember.find({ teamId: meetingData.teamId, userId: { $in: meetingData.participants.map(p => p.id._id) } }).select("userId functionalRole").populate("userId", "name");

        // console.log("Fetched participants with roles for prompt generation:", participatantsWithRoles);
        if (!meetingData || !participatantsWithRoles) {
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
        ${participatantsWithRoles.map(p => `${p.userId._id} - ${p.userId.name} (${p.functionalRole})`).join("\n")}

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
            - responsibleFunctionalRole should be same as in the provided participant list,
            - dont invent functional roles, if not sure about functional role, keep it null
            
            ----------------------------
            RETURN STRICT JSON ONLY (NO TEXT, NO EXPLANATION):
            
            {
                "summary": "string",
                "decisions": ["string"],
                "tasks": [
                    {
                "user_id": "string",
                "responsibleName": "string",
                "responsibleFunctionalRole": "string",
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
            }
            
            ----------------------------
            STRICT OUTPUT RULES:
            - Always return valid JSON
            - No extra text before or after JSON
            - Use empty arrays if no data
            - All IDs must match given participants
            `;

        return buildPrompt;
    }
    catch (error) {
        console.error("Error generating prompt:", error);
        throw error;
    }
};
