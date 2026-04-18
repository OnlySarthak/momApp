const meeting = require("../../models/meeting.model");
const teamMember = require("../../models/teamMember.model");
const mom = require("../../models/mom.model");
const task = require("../../models/task.model");
const teamStats = require("../../models/teamStats.model");
const transcriptModel = require("../../models/transcript.model");
const { GoogleGenAI } = require("@google/genai");

exports.startMeetingProcessingInBackground = async (meetingId, audioFileUrl) => {
    try {
        const prompt = await generatePrompt(meetingId);

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        });

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        {
                            fileData: {
                                mimeType: "audio/mpeg",
                                fileUri: audioFileUrl,
                            },
                        },
                    ],
                },
            ],
        });

        const aiText = response.candidates[0].content.parts[0].text;

        console.log("AI RAW TEXT:", aiText);

        await postProcessMeetingOperations(meetingId, aiText);
    } catch (error) {
        console.error("Error processing meeting:", error);
        await meeting.findByIdAndUpdate(meetingId, {
            processingStage: "failed",
        });
    }
};

const postProcessMeetingOperations = async (meetingId, aiResponse) => {
    try {
        const parsed = JSON.parse(aiResponse);

        const {
            summary,
            decisions,
            insights,
            contextLabel,
            attendees,
            transcript,
            tasks,
            team_stats,
        } = parsed;

        const meetingData = await meeting.findById(meetingId);

        if (!meetingData) throw new Error("Meeting not found");

        // 🚫 prevent duplicate MOM
        const existingMoM = await mom.findOne({ meetingId });
        if (existingMoM) {
            throw new Error("MoM already exists");
        }

        // ✅ SAVE MOM
        const momSaved = await mom.create({
            meetingId,
            MeetingTitle: meetingData.title,
            summary,
            decisions,
            insights,
            contextLable: contextLabel,
            presentAttendees: attendees.map((a) => ({
                userId: a.user_id,
                name: a.name,
                functionalRole: a.functionalRole,
            })),
            workspaceId: meetingData.workspaceId,
            teamId: meetingData.teamId,
        });

        // ✅ SAVE TRANSCRIPT
        if (transcript && transcript.length > 0) {
            await transcriptModel.create({
                meetingId,
                MOMId: momSaved._id,
                content: transcript,
            });
        }

        // ✅ SAVE TASKS
        for (const group of tasks) {
            const { user_id, responsibleName, responsibleFunctionalRole, pending, in_progress, completed } = group;

            for (const t of pending) {
                await task.create({
                    title: t,
                    responsibleId: user_id,
                    resposibleName: responsibleName,
                    responsibleFunctionalRole,
                    state: "pending",
                    momId: momSaved._id,
                    workspaceId: meetingData.workspaceId,
                    teamId: meetingData.teamId,
                });
            }

            for (const t of in_progress) {
                await task.create({
                    title: t,
                    responsibleId: user_id,
                    resposibleName: responsibleName,
                    responsibleFunctionalRole,
                    state: "in_progress",
                    momId: momSaved._id,
                    workspaceId: meetingData.workspaceId,
                    teamId: meetingData.teamId,
                });
            }

            for (const t of completed) {
                await task.create({
                    title: t,
                    responsibleId: user_id,
                    resposibleName: responsibleName,
                    responsibleFunctionalRole,
                    state: "completed",
                    momId: momSaved._id,
                    workspaceId: meetingData.workspaceId,
                    teamId: meetingData.teamId,
                });
            }
        }

        // ✅ UPDATE TEAM STATS
        await teamStats.findOneAndUpdate(
            { teamId: meetingData.teamId },
            {
                totalTasks: team_stats.totalTasks,
                completedTasks: team_stats.completedTasks,
                pendingTasks: team_stats.pendingTasks,
                inProgressTasks: team_stats.inProgressTasks,
                lastUpdated: new Date(),
            },
            { upsert: true, new: true }
        );

        console.log("✅ Meeting processing completed:", meetingId);
    } catch (error) {
        console.error("❌ Post-processing error:", error);
    }
};

const generatePrompt = async (meetingId) => {
    const meetingData = await meeting.findById(meetingId);

    if (!meetingData) throw new Error("Meeting not found");

    // ✅ GET ALL TEAM MEMBERS (NOT JUST PARTICIPANTS)
    const teamMembers = await teamMember
        .find({ teamId: meetingData.teamId })
        .populate("userId", "name");

    const prompt = `
You are an advanced AI meeting assistant.

INPUT:
- Meeting audio file
- Full team member list (with roles)

-------------------------------------

TEAM MEMBERS (ALL POSSIBLE PARTICIPANTS):
${teamMembers
            .map(
                (m) => `${m.userId._id} - ${m.userId.name} (${m.functionalRole})`
            )
            .join("\n")}

-------------------------------------

IMPORTANT:
- Above list contains ALL team members
- NOT all members attended the meeting
- You must identify:
  - Who actually spoke
  - Who actively contributed
  - Who was assigned tasks

-------------------------------------

YOUR TASKS:

1. Transcribe the full meeting
2. Identify ACTIVE participants (attendees)
3. Generate summary
4. Extract key decisions
5. Generate insights
6. Assign tasks ONLY to valid team members
7. Classify tasks (pending / in_progress / completed)

-------------------------------------

RETURN STRICT JSON:

{
  "summary": "string",
  "decisions": ["string"],
  "insights": "string",
  "contextLabel": "string",

  "attendees": [
    {
      "user_id": "string",
      "name": "string",
      "functionalRole": "string"
    }
  ],

  "transcript": [
    {
      "speaker": "string",
      "text": "string",
      "timestamp": "HH:MM:SS"
    }
  ],

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
  }
}

-------------------------------------

STRICT RULES:

- ONLY use user_ids from the team member list
- DO NOT invent users
- If unsure about assignment → skip
- Attendees = ONLY those who spoke or contributed
- Use empty arrays if no data
- Return valid JSON ONLY (no explanation)
`;

    return prompt;
};