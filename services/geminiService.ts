import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { supabase, TABLES } from "../supabase";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Define the tool for the model (MCP-like functionality)
const querySubmissionsTool: FunctionDeclaration = {
  name: "querySubmissions",
  description: "Search the database for conference submissions. Use this to answer questions about papers, tracks, and submission counts.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      track: {
        type: Type.STRING,
        description: "The research track to filter by (e.g., 'Bioinformatics', 'AI Ethics'). Optional."
      },
      status: {
        type: Type.STRING,
        description: "The status of the paper (e.g., 'Submitted', 'Accepted'). Optional."
      }
    }
  }
};

export const chatWithAssistant = async (userMessage: string, chatHistory: any[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        tools: [{ functionDeclarations: [querySubmissionsTool] }],
        systemInstruction: "You are the Sympose AI Assistant. You help organizers manage scientific conferences. You have access to tools to query the submission database. If you use a tool, explain the findings clearly. If you don't find data, suggest alternative tracks."
      },
    });

    const calls = response.functionCalls;
    if (calls && calls.length > 0) {
      const results = [];
      for (const call of calls) {
        if (call.name === "querySubmissions") {
          const { track, status } = call.args as any;
          
          // Build query for Supabase
          let query = supabase
            .from(TABLES.FORM_SUBMISSIONS)
            .select('*');
          
          // Note: track and status would need to be stored in the answers JSON field
          // This is a simplified version - you may need to adjust based on your data structure
          if (track || status) {
            // Since track/status might be in answers JSON, we'd need to filter differently
            // For now, get all submissions and filter in memory (not ideal for large datasets)
            query = query.limit(1000); // Limit to prevent memory issues
          }
          
          const { data: docs, error } = await query;
          
          if (error) {
            throw error;
          }
          
          // Filter in memory (you may want to use PostgREST filters if track/status are separate columns)
          let filteredDocs = docs || [];
          if (track) {
            // Assuming track is in answers JSON - adjust based on your structure
            filteredDocs = filteredDocs.filter((doc: any) => {
              try {
                const answers = typeof doc.answers === 'string' ? JSON.parse(doc.answers) : doc.answers;
                return answers?.track === track;
              } catch {
                return false;
              }
            });
          }
          if (status) {
            filteredDocs = filteredDocs.filter((doc: any) => {
              try {
                const answers = typeof doc.answers === 'string' ? JSON.parse(doc.answers) : doc.answers;
                return answers?.status === status;
              } catch {
                return false;
              }
            });
          }
          
          const data = filteredDocs.map((doc: any) => ({ id: doc.id, ...doc }));
          
          results.push({
            id: call.id,
            name: call.name,
            response: { submissions: data, count: data.length }
          });
        }
      }

      // Send the tool results back to get final answer
      const finalResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
          ...chatHistory,
          { role: 'user', parts: [{ text: userMessage }] },
          { role: 'model', parts: response.candidates[0].content.parts },
          { role: 'user', parts: results.map(r => ({
            functionResponse: {
              id: r.id,
              name: r.name,
              response: r.response
            }
          })) }
        ]
      });
      return finalResponse.text;
    }

    return response.text;
  } catch (error) {
    console.error("Gemini Assistant Error:", error);
    return "I'm having trouble accessing the conference data right now. Please try again in a moment.";
  }
};

export const generateDescription = async (title: string, location: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a professional, engaging, and concise 2-paragraph "About" section for a scientific conference titled "${title}" taking place in ${location}. Focus on innovation and networking.`,
    });
    return response.text || "Could not generate description.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating content. Please try again.";
  }
};

export const analyzeAbstract = async (abstract: string): Promise<{ summary: string; rating: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following scientific abstract. Provide a 1-sentence summary and a "Relevance Score" (Low/Medium/High) for a general technology conference.
      
      Abstract: "${abstract}"
      
      Output format:
      Summary: [Summary]
      Relevance: [Score]`,
    });
    
    const text = response.text || "";
    const summaryMatch = text.match(/Summary:\s*(.*)/i);
    const relevanceMatch = text.match(/Relevance:\s*(.*)/i);

    return {
      summary: summaryMatch ? summaryMatch[1] : "Could not summarize.",
      rating: relevanceMatch ? relevanceMatch[1] : "Unknown"
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { summary: "Error analyzing abstract.", rating: "Error" };
  }
};
