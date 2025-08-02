import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEYS = [
  'AIzaSyCXKdPdqqR6jMbm7dkd-J3xy61OMHxP-Ts',
  'AIzaSyC9n3tGekNjSKVbA0kbhAuZR4Nqp_ushPQ',
  'AIzaSyC-NzpMgyG71kH1NM_953z7WiySfmUiJYI'
];

let currentKeyIndex = 0;

const getNextApiKey = (): string => {
  const key = GEMINI_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
  return key;
};

const makeRequestWithFallback = async <T>(
  requestFn: (ai: GoogleGenAI) => Promise<T>
): Promise<T> => {
  let lastError: Error | null = null;
  
  // Try each API key once
  for (let i = 0; i < GEMINI_API_KEYS.length; i++) {
    try {
      const apiKey = getNextApiKey();
      const ai = new GoogleGenAI({ apiKey });
      return await requestFn(ai);
    } catch (error) {
      lastError = error as Error;
      console.warn(`API key ${i + 1} failed:`, error);
      
      // Continue to next API key immediately on failure
      if (i < GEMINI_API_KEYS.length - 1) {
        console.log(`Trying next API key (${i + 2}/${GEMINI_API_KEYS.length})...`);
      }
    }
  }
  
  throw lastError || new Error('All API keys failed');
};

export const geminiApi = {
  async generatePlaylist(mood: string, preferences: string = '', source: 'youtube' | 'spotify' = 'youtube'): Promise<string[]> {
    try {
      console.log('Generating playlist with mood:', mood, 'preferences:', preferences, 'source:', source);
      
      const prompt = `You are a music expert and playlist curator. Based on the user's request: "${mood}" ${preferences ? `and preferences: "${preferences}"` : ''}, suggest 15-20 popular and well-known songs that would match this mood, feeling, genre, or activity.
      
      IMPORTANT RULES:
      1. You MUST return ONLY a JSON array of songs in the format: ["Song Title - Artist Name", "Song Title - Artist Name"]
      2. Do NOT include any explanations, markdown, or extra text
      3. Focus on popular songs available on ${source === 'youtube' ? 'YouTube' : 'Spotify'}
      4. Each song must be in the format "Song Title - Artist Name"
      5. Return exactly 15-20 songs
      
      Example response:
      ["Bohemian Rhapsody - Queen", "Hotel California - Eagles", "Billie Jean - Michael Jackson", "Sweet Child O' Mine - Guns N' Roses"]`;

      const response = await makeRequestWithFallback(async (ai) => {
        const result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
        console.log('Gemini API response:', result.text);
        return result;
      });

      const responseText = response.text;
      
      try {
        // Preprocess the response to extract JSON from potential markdown or extra text
        let cleanedResponse = responseText.trim().replace(/```json|```/g, '');
        console.log('Raw response from Gemini:', cleanedResponse);
        
        // First, try to extract from markdown code block
        const markdownMatch = cleanedResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (markdownMatch) {
          cleanedResponse = markdownMatch[1].trim();
          console.log('Extracted from markdown:', cleanedResponse);
        }
          // If no markdown block, find the first '[' and last ']' to extract JSON array
          const firstBracket = cleanedResponse.indexOf('[');
          const lastBracket = cleanedResponse.lastIndexOf(']');
          
          if (firstBracket !== -1 && lastBracket !== -1 && firstBracket < lastBracket) {
            cleanedResponse = cleanedResponse.substring(firstBracket, lastBracket + 1);
            console.log('Extracted JSON array:', cleanedResponse);
          }
        
        const songList = JSON.parse(cleanedResponse);
        console.log('Parsed song list:', songList);
        
        if (Array.isArray(songList) && songList.length > 0) {
          // Validate that songs are in the correct format
          const validSongs = songList.filter(song => 
            typeof song === 'string' && song.includes(' - ') && song.length > 5
          );
          console.log('Valid songs after filtering:', validSongs);
          return validSongs;
        }
        
        console.warn('No valid songs found in response');
        return [];
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.error('Raw response:', responseText);
        
        // Fallback: try to extract song names manually if JSON parsing fails
        const lines = responseText.split(/\n|,/);
        const songs = [];
        for (const line of lines) {
          let trimmed = line.trim();
          // Remove quotes, numbers, bullets, etc.
          trimmed = trimmed.replace(/^["'\d\.\-\*\s]+|["']$/g, '');
          
          if (trimmed.includes(' - ') && trimmed.length > 5 && 
              !trimmed.toLowerCase().includes('example') && 
              !trimmed.toLowerCase().includes('format')) {
            // Remove quotes and clean up
            const cleaned = trimmed.replace(/["\[\]]/g, '');
            if (cleaned.length > 5 && cleaned.split(' - ').length === 2) {
              songs.push(cleaned);
            }
          }
        }
        console.log('Fallback extracted songs:', songs);
        return songs.slice(0, 20); // Limit to 20 songs
      }
    } catch (error) {
      console.error('Error generating playlist:', error);
      return [];
    }
  },

  async generatePlaylistName(mood: string, songs: string[]): Promise<string> {
    try {
      const prompt = `Based on the user's request: "${mood}" and these songs: ${songs.slice(0, 5).join(', ')}, 
      create a short, creative playlist name that captures the mood and vibe. 
      Return only the playlist name, nothing else. Keep it under 50 characters.`;

      const response = await makeRequestWithFallback(async (ai) => {
        return await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
      });

      return response.text.trim().replace(/['"]/g, '');
    } catch (error) {
      console.error('Error generating playlist name:', error);
      return `Mood: ${mood}`;
    }
  },

  async chatWithAI(message: string, context: string = ''): Promise<string> {
    try {
      const prompt = `You are BuggyAI, a friendly and enthusiastic music assistant that helps users discover music.
      ${context ? `Previous context: ${context}` : ''}
      
      User message: "${message}"
      
      IMPORTANT INSTRUCTIONS:
      1. ALWAYS be enthusiastic about creating playlists
      2. When users mention ANY mood, feeling, genre, activity, or ask for music, ALWAYS say you're creating a playlist
      3. Keep responses short and engaging (1-2 sentences)
      4. Use emojis to make responses fun
      5. ALWAYS mention creating/generating a playlist when users ask for music
      6. If user is editing an existing playlist, be enthusiastic about modifying it
      7. For playlist editing requests, acknowledge the changes you'll make
      
      When creating a playlist, respond with something like:
      "🎵 Perfect! I'm creating an amazing [mood/genre] playlist for you!"
      "🎶 Great idea! Let me generate some awesome songs for [their request]!"
      "✨ I'm on it! Creating the perfect playlist for [their mood]!"
      
      When editing a playlist, respond with something like:
      "🎵 Perfect! I'll make this playlist [requested change]!"
      "🎶 Great idea! Let me modify your playlist to be more [requested mood]!"
      "✨ I'm on it! Editing your playlist to [requested changes]!"
      
      Examples that should trigger playlist creation:
      - Any emotion: "happy", "sad", "excited", "chill"
      - Any activity: "workout", "study", "party", "driving"
      - Any genre: "rock", "pop", "jazz", "electronic"
      - Music requests: "music", "songs", "playlist"
      - Mood descriptions: "feeling good", "need energy"

      Special responses:
      - If user says "Yaşasın Cumhuriyet": respond "Yaşasın Türkiyem! 🇹🇷 Creating a Turkish Republic playlist!"
      - If user complains: respond "SHUT THE FUCK UP KOLAYSA SEN YAP KOCA GÖTLÜ ŞEY!" and create a one song playlist that only has Lvbel C5 - DACİA.
      
      Examples of playlist management requests:
      - "Add more songs to my workout playlist"
      - "I want to edit my chill playlist"
      - "Remove some songs from my party playlist"
      - "Make my study playlist longer"
      - "Change the description of my road trip playlist"
      YOU MUST EDIT THE PLAYLIST

      Be conversational, excited, and always ready to create playlists!`;

      const response = await makeRequestWithFallback(async (ai) => {
        return await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
      });

      return response.text;
    } catch (error) {
      console.error('Error chatting with AI:', error);
      return 'Sorry, I encountered an error. Please try again later.';
    }
  },

  async generatePlaylistEdit(userRequest: string, currentPlaylist: any): Promise<{
    songsToAdd?: string[];
    songsToRemove?: string[];
    newDescription?: string;
  } | null> {
    try {
      const currentSongs = currentPlaylist.songs.map((song: any) => `${song.title} - ${song.artist}`).slice(0, 10);
      
      const prompt = `You are a music expert helping to edit a playlist based on user requests.
      
      Current playlist: "${currentPlaylist.name}"
      Current songs (first 10): ${currentSongs.join(', ')}
      Total songs: ${currentPlaylist.songs.length}
      
      User request: "${userRequest}"
      
      Based on the user's request, provide editing instructions in JSON format:
      
      {
        "songsToAdd": ["Song Title - Artist", "Song Title - Artist"],
        "songsToRemove": ["partial song title or artist name to match"],
        "newDescription": "optional new description for the playlist"
      }
      
      RULES:
      1. For "songsToAdd": Suggest 3-8 specific songs that match the user's request
      2. For "songsToRemove": Use partial titles or artist names that would match existing songs to remove
      3. If user says "make it sadder", add sad songs and remove upbeat ones
      4. If user says "add more rock", just add rock songs
      5. If user says "remove slow songs", just remove slow songs
      6. Return ONLY valid JSON, no explanations
      
      Examples:
      - "make it sadder" → add sad songs, remove happy/upbeat songs
      - "add more rock" → add rock songs only
      - "remove ballads" → remove slow/ballad songs only
      - "make it more energetic" → add energetic songs, remove slow ones`;

      const response = await makeRequestWithFallback(async (ai) => {
        return await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
      });

      const responseText = response.text.trim();
      console.log('Raw edit response from Gemini:', responseText);
      
      try {
        // Clean up the response to extract JSON
        let cleanedResponse = responseText.replace(/```json|```/g, '').trim();
        
        // Find JSON object
        const jsonStart = cleanedResponse.indexOf('{');
        const jsonEnd = cleanedResponse.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
          cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
        }
        
        const editInstructions = JSON.parse(cleanedResponse);
        console.log('Parsed edit instructions:', editInstructions);
        
        return editInstructions;
      } catch (parseError) {
        console.error('Error parsing edit instructions:', parseError);
        console.error('Raw response:', responseText);
        return null;
      }
    } catch (error) {
      console.error('Error generating playlist edit instructions:', error);
      return null;
    }
  }
};