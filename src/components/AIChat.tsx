import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Music, X, Loader, List, Plus, Edit3, Check } from 'lucide-react';
import { AIMessage, SpotifyAuthState } from '../types';
import { geminiApi } from '../services/geminiApi';
import { LoadingSpinner } from './LoadingSpinner';
import { useTranslation } from '../utils/translations';
import { Playlist } from '../types';

interface AIChatProps {
  messages: AIMessage[];
  onMessagesUpdate: (messages: AIMessage[]) => void;
  onPlaylistGenerated: (songs: string[], source?: 'youtube' | 'spotify') => Promise<any>;
  onPlaylistUpdated?: (playlist: Playlist) => void;
  language: 'en' | 'tr' | 'es';
  isCreatingPlaylist?: boolean;
  spotifyAuthState: SpotifyAuthState;
  playlists: Playlist[];
}

export const AIChat: React.FC<AIChatProps> = ({ 
  messages, 
  onMessagesUpdate, 
  onPlaylistGenerated,
  onPlaylistUpdated,
  language,
  isCreatingPlaylist = false,
  spotifyAuthState,
  playlists
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [createdPlaylist, setCreatedPlaylist] = useState<any>(null);
  const [playlistSource, setPlaylistSource] = useState<'youtube' | 'spotify'>('youtube');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [isEditingPlaylist, setIsEditingPlaylist] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation(language);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const now = Date.now();
    if (now - lastRequestTime < 2000) {
      const remainingTime = Math.ceil((2000 - (now - lastRequestTime)) / 1000);
      alert(`Please wait ${remainingTime} seconds before sending another message.`);
      return;
    }

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      content: input.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    onMessagesUpdate(newMessages);
    
    const userInput = input.trim();
    setInput('');
    setIsLoading(true);
    setLastRequestTime(now);

    try {
      console.log('🎵 User input:', userInput);
      
      // Get AI response first
      const context = messages.slice(-3).map(msg => `${msg.sender}: ${msg.content}`).join('\n');
      const playlistContext = selectedPlaylist ? `Currently editing playlist: "${selectedPlaylist.name}" with ${selectedPlaylist.songs.length} songs` : '';
      const fullContext = `${context}\n${playlistContext}`;
      const aiResponse = await geminiApi.chatWithAI(userInput, fullContext);
      
      console.log('🤖 AI response:', aiResponse);

      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      onMessagesUpdate([...newMessages, aiMessage]);

      // Check if we should create a playlist
      const shouldCreatePlaylist = !selectedPlaylist && checkIfShouldCreatePlaylist(userInput, aiResponse);
      const shouldEditPlaylist = selectedPlaylist && checkIfShouldEditPlaylist(userInput, aiResponse);
      console.log('🎵 Should create playlist:', shouldCreatePlaylist);
      console.log('🎵 Should edit playlist:', shouldEditPlaylist);

      if (shouldEditPlaylist && selectedPlaylist) {
        console.log('🎵 Editing existing playlist...');
        
        // Show editing message
        const editingMessage: AIMessage = {
          id: (Date.now() + 2).toString(),
          content: `🎵 Editing "${selectedPlaylist.name}"... Let me modify it based on your request!`,
          sender: 'ai',
          timestamp: new Date()
        };
        onMessagesUpdate([...newMessages, aiMessage, editingMessage]);
        
        setIsEditingPlaylist(true);
        
        try {
          // Generate songs to add/remove based on the request
          const editInstructions = await geminiApi.generatePlaylistEdit(userInput, selectedPlaylist);
          console.log('🎵 Edit instructions:', editInstructions);
          
          if (editInstructions) {
            let updatedPlaylist = { ...selectedPlaylist };
            let changes: string[] = [];
            
            // Remove songs if specified
            if (editInstructions.songsToRemove && editInstructions.songsToRemove.length > 0) {
              const songsToRemove = editInstructions.songsToRemove;
              updatedPlaylist.songs = updatedPlaylist.songs.filter(song => {
                const shouldRemove = songsToRemove.some(removeTitle => 
                  song.title.toLowerCase().includes(removeTitle.toLowerCase()) ||
                  removeTitle.toLowerCase().includes(song.title.toLowerCase())
                );
                if (shouldRemove) {
                  changes.push(`❌ Removed: ${song.title} - ${song.artist}`);
                }
                return !shouldRemove;
              });
            }
            
            // Add new songs if specified
            if (editInstructions.songsToAdd && editInstructions.songsToAdd.length > 0) {
              const newSongs = await geminiApi.generatePlaylist('', editInstructions.songsToAdd.join(', '), playlistSource);
              if (newSongs && newSongs.length > 0) {
                const playlist = await onPlaylistGenerated(newSongs, playlistSource);
                if (playlist && playlist.songs) {
                  // Add new songs to the existing playlist
                  const existingSongIds = new Set(updatedPlaylist.songs.map(s => s.id));
                  const songsToAdd = playlist.songs.filter(song => !existingSongIds.has(song.id));
                  
                  updatedPlaylist.songs = [...updatedPlaylist.songs, ...songsToAdd];
                  songsToAdd.forEach(song => {
                    changes.push(`✅ Added: ${song.title} - ${song.artist}`);
                  });
                }
              }
            }
            
            // Update playlist metadata
            updatedPlaylist.updatedAt = new Date();
            if (editInstructions.newDescription) {
              updatedPlaylist.description = editInstructions.newDescription;
            }
            
            // Notify parent component about the update
            if (onPlaylistUpdated) {
              onPlaylistUpdated(updatedPlaylist);
            }
            
            // Update selected playlist
            setSelectedPlaylist(updatedPlaylist);
            
            const successMessage: AIMessage = {
              id: (Date.now() + 3).toString(),
              content: `🎉 Successfully updated "${updatedPlaylist.name}"!

📝 Changes made:
${changes.length > 0 ? changes.slice(0, 10).join('\n') : '• No specific songs were changed'}
${changes.length > 10 ? `\n... and ${changes.length - 10} more changes!` : ''}

🎵 Your playlist now has ${updatedPlaylist.songs.length} songs!

You can continue editing by saying things like:
• "Add more upbeat songs"
• "Remove the slow songs"
• "Make it more energetic"`,
              sender: 'ai',
              timestamp: new Date()
            };
            onMessagesUpdate([...newMessages, aiMessage, successMessage]);
            
          } else {
            throw new Error('Could not generate edit instructions');
          }
        } catch (editError) {
          console.error('❌ Playlist editing error:', editError);
          const errorMessage: AIMessage = {
            id: (Date.now() + 3).toString(),
            content: `😅 Sorry, I had trouble editing that playlist. Could you try being more specific? For example:
            
• "Add more sad songs to this playlist"
• "Remove the upbeat songs"
• "Make this playlist more energetic"
• "Add some rock songs"

What changes would you like me to make?`,
            sender: 'ai',
            timestamp: new Date()
          };
          onMessagesUpdate([...newMessages, aiMessage, errorMessage]);
        } finally {
          setIsEditingPlaylist(false);
        }
      } else if (shouldCreatePlaylist) {
        console.log('🎵 Creating playlist...');
        
        // Show creating message
        const creatingMessage: AIMessage = {
          id: (Date.now() + 2).toString(),
          content: `🎵 Creating your playlist from ${playlistSource === 'spotify' ? 'Spotify' : 'YouTube'}... This might take a moment!`,
          sender: 'ai',
          timestamp: new Date()
        };
        onMessagesUpdate([...newMessages, aiMessage, creatingMessage]);

        try {
          // Generate playlist
          const songs = await geminiApi.generatePlaylist(userInput, '', playlistSource);
          console.log('🎵 Generated songs:', songs);
          
          if (songs && songs.length > 0) {
            const playlist = await onPlaylistGenerated(songs, playlistSource);
            console.log('🎵 Created playlist:', playlist);
            
            if (playlist) {
              setCreatedPlaylist(playlist);
              
              const successMessage: AIMessage = {
                id: (Date.now() + 3).toString(),
                content: `🎉 Perfect! I've created "${playlist.name}" with ${playlist.songs.length} songs!

📝 Songs added:
${playlist.songs.slice(0, 5).map((song: any) => `• ${song.title} - ${song.artist}`).join('\n')}
${playlist.songs.length > 5 ? `\n... and ${playlist.songs.length - 5} more songs!` : ''}

🎵 You can find it in your playlists or click the button below to view it!`,
                sender: 'ai',
                timestamp: new Date()
              };
              onMessagesUpdate([...newMessages, aiMessage, successMessage]);
            } else {
              throw new Error('Failed to create playlist');
            }
          } else {
            throw new Error('No songs generated');
          }
        } catch (playlistError) {
          console.error('❌ Playlist creation error:', playlistError);
          const errorMessage: AIMessage = {
            id: (Date.now() + 3).toString(),
            content: `😅 Sorry, I had trouble creating that playlist. Could you try being more specific? For example:
            
• "Create a workout playlist"
• "I want relaxing jazz music"  
• "Make me a rock playlist"
• "Songs for studying"

What kind of music are you in the mood for?`,
            sender: 'ai',
            timestamp: new Date()
          };
          onMessagesUpdate([...newMessages, aiMessage, errorMessage]);
        }
      }
    } catch (error) {
      console.error('❌ Chat error:', error);
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again!',
        sender: 'ai',
        timestamp: new Date()
      };
      onMessagesUpdate([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfShouldCreatePlaylist = (userInput: string, aiResponse: string): boolean => {
    const input = userInput.toLowerCase();
    const response = aiResponse.toLowerCase();
    
    // Strong indicators for playlist creation
    const playlistKeywords = [
      'playlist', 'create', 'generate', 'make', 'songs', 'music',
      'feeling', 'mood', 'happy', 'sad', 'energetic', 'chill', 'relax',
      'party', 'workout', 'study', 'romantic', 'dance', 'rock', 'pop',
      'jazz', 'classical', 'hip hop', 'electronic', 'indie', 'acoustic',
      'morning', 'evening', 'night', 'driving', 'cooking', 'reading',
      'focus', 'meditation', 'upbeat', 'mellow', 'vibes'
    ];
    
    // AI response indicators
    const aiIndicators = [
      'creating', 'i\'ll create', 'let me create', 'i\'m creating',
      'generating', 'i\'ll generate', 'perfect!', 'great!'
    ];
    
    // Check user input
    const hasPlaylistKeyword = playlistKeywords.some(keyword => input.includes(keyword));
    
    // Check AI response
    const hasAIIndicator = aiIndicators.some(indicator => response.includes(indicator));
    
    // Special cases
    const isDirectRequest = input.includes('create') || input.includes('make') || input.includes('generate');
    const mentionsMusic = input.includes('music') || input.includes('song');
    
    console.log('🔍 Playlist check:', {
      hasPlaylistKeyword,
      hasAIIndicator,
      isDirectRequest,
      mentionsMusic,
      userInput: input,
      aiResponse: response.substring(0, 100)
    });
    
    return hasPlaylistKeyword || hasAIIndicator || (isDirectRequest && mentionsMusic);
  };

  const checkIfShouldEditPlaylist = (userInput: string, aiResponse: string): boolean => {
    const input = userInput.toLowerCase();
    const response = aiResponse.toLowerCase();
    
    // Edit indicators
    const editKeywords = [
      'add', 'remove', 'delete', 'change', 'modify', 'edit', 'update',
      'make it', 'make this', 'more', 'less', 'sadder', 'happier',
      'energetic', 'calm', 'upbeat', 'slow', 'fast', 'rock', 'pop',
      'jazz', 'classical', 'electronic', 'acoustic', 'replace'
    ];
    
    // AI response indicators for editing
    const aiEditIndicators = [
      'editing', 'i\'ll edit', 'let me edit', 'i\'m editing',
      'modifying', 'i\'ll modify', 'updating', 'changing'
    ];
    
    // Check user input for edit keywords
    const hasEditKeyword = editKeywords.some(keyword => input.includes(keyword));
    
    // Check AI response
    const hasAIEditIndicator = aiEditIndicators.some(indicator => response.includes(indicator));
    
    // Special edit patterns
    const isEditRequest = input.includes('this playlist') || input.includes('the playlist');
    const mentionsPlaylistModification = input.includes('playlist') && (
      input.includes('add') || input.includes('remove') || input.includes('change') ||
      input.includes('make it') || input.includes('make this')
    );
    
    console.log('🔍 Edit check:', {
      hasEditKeyword,
      hasAIEditIndicator,
      isEditRequest,
      mentionsPlaylistModification,
      userInput: input,
      aiResponse: response.substring(0, 100)
    });
    
    return hasEditKeyword || hasAIEditIndicator || isEditRequest || mentionsPlaylistModification;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGoToPlaylist = () => {
    if (createdPlaylist) {
      try {
        const event = new CustomEvent('goToPlaylist', { 
          detail: createdPlaylist,
          bubbles: true,
          cancelable: true
        });
        window.dispatchEvent(event);
        console.log('Dispatched goToPlaylist event:', createdPlaylist);
      } catch (error) {
        console.error('Error dispatching goToPlaylist event:', error);
      }
    }
  };

  const handlePlaylistSelect = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setShowPlaylistSelector(false);
    
    // Add a message about playlist selection
    const selectionMessage: AIMessage = {
      id: Date.now().toString(),
      content: `🎵 Selected playlist: "${playlist.name}" (${playlist.songs.length} songs)
      
Now you can ask me to modify it! Try saying:
• "Make this playlist sadder"
• "Add more upbeat songs"
• "Remove slow songs"
• "Add some rock music"`,
      sender: 'ai',
      timestamp: new Date()
    };
    
    onMessagesUpdate([...messages, selectionMessage]);
  };

  const handleCreateNewPlaylist = () => {
    setSelectedPlaylist(null);
    setShowPlaylistSelector(false);
    
    const createMessage: AIMessage = {
      id: Date.now().toString(),
      content: `🎵 Ready to create a new playlist! 
      
Tell me what kind of music you want:
• "Create a workout playlist"
• "I want sad songs"
• "Make me a rock playlist"
• "Songs for studying"`,
      sender: 'ai',
      timestamp: new Date()
    };
    
    onMessagesUpdate([...messages, createMessage]);
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white">{t('buggyAIChat')}</h2>
          <p className="text-gray-400 text-sm">{t('askMoodHelp')}</p>
        </div>
        
        {/* Selected Playlist Info */}
        {selectedPlaylist && (
          <div className="mt-3 p-3 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300 font-medium">Editing: {selectedPlaylist.name}</span>
                <span className="text-blue-400 text-sm">({selectedPlaylist.songs.length} songs)</span>
              </div>
              <button
                onClick={() => setSelectedPlaylist(null)}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-blue-300 text-xs mt-1">
              Ask me to modify this playlist! Try "make it sadder" or "add more upbeat songs"
            </p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-black">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">{t('askMoodHelp')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-md mx-auto">
              <button
                onClick={() => setInput('Create a workout playlist')}
                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-left transition-colors"
              >
                🏋️ Create a workout playlist
              </button>
              <button
                onClick={() => setInput('I want relaxing music')}
                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-left transition-colors"
              >
                😌 I want relaxing music
              </button>
              <button
                onClick={() => setInput('Make me a rock playlist')}
                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-left transition-colors"
              >
                🎸 Make me a rock playlist
              </button>
              <button
                onClick={() => setInput('Songs for studying')}
                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-left transition-colors"
              >
                📚 Songs for studying
              </button>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-3 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.sender === 'user' ? 'bg-blue-600' : 'bg-gray-700'
              }`}>
                {message.sender === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div className={`px-4 py-3 rounded-2xl ${
                message.sender === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-white'
              }`}>
                <div className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </div>
                <span className={`text-xs mt-2 block opacity-70`}>
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-800 px-4 py-3 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="small" />
                  <span className="text-white text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Playlist Selector Modal */}
      {showPlaylistSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-md w-full max-h-[70vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold">Select Playlist to Edit</h3>
              <button
                onClick={() => setShowPlaylistSelector(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4">
              {/* Create New Option */}
              <button
                onClick={handleCreateNewPlaylist}
                className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-3 mb-4"
              >
                <Plus className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Create New Playlist</div>
                  <div className="text-sm opacity-90">Start fresh with AI-generated music</div>
                </div>
              </button>
              
              {/* Existing Playlists */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <h4 className="text-gray-400 text-sm font-medium mb-2">Or edit existing playlist:</h4>
                {playlists.length > 0 ? (
                  playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => handlePlaylistSelect(playlist)}
                      className={`w-full p-3 rounded-lg transition-colors text-left flex items-center space-x-3 ${
                        selectedPlaylist?.id === playlist.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                        {playlist.isAIGenerated ? (
                          <Bot className="w-5 h-5 text-white" />
                        ) : (
                          <Music className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{playlist.name}</div>
                        <div className="text-sm opacity-75 truncate">
                          {playlist.songs.length} songs
                          {playlist.isAIGenerated && ' • AI Generated'}
                        </div>
                      </div>
                      {selectedPlaylist?.id === playlist.id && (
                        <Check className="w-5 h-5 text-white" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No playlists found</p>
                    <p className="text-xs">Create your first playlist to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Go to Playlist Button */}
      {createdPlaylist && (
        <div className="border-t border-gray-800 p-4 bg-gray-900 flex-shrink-0">
          <button
            onClick={handleGoToPlaylist}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 font-medium"
          >
            <Music className="w-4 h-4" />
            <span>Go to "{createdPlaylist.name}" Playlist</span>
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-800 p-4 bg-black flex-shrink-0">
        {/* Source Selection */}
        <div className="flex items-center justify-center space-x-2 mb-4">
          <span className="text-gray-400 text-sm">Create playlists from:</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPlaylistSource('youtube')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-300 flex items-center space-x-2 ${
                playlistSource === 'youtube'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span>YouTube</span>
            </button>
            <button
              onClick={() => setPlaylistSource('spotify')}
              disabled={!spotifyAuthState?.isAuthenticated}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-300 flex items-center space-x-2 ${
                playlistSource === 'spotify'
                  ? 'bg-green-600 text-white'
                  : spotifyAuthState?.isAuthenticated 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
              title={!spotifyAuthState?.isAuthenticated ? 'Login to Spotify in Settings first' : 'Create playlists in Spotify'}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              <span>Spotify</span>
              {!spotifyAuthState?.isAuthenticated && (
                <span className="text-xs opacity-75">(Login required)</span>
              )}
            </button>
          </div>
          <button
            onClick={() => setShowPlaylistSelector(true)}
            className="bg-white text-black px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 text-sm font-medium"
          >
            <List className="w-4 h-4" />
            <span>Select Playlist</span>
          </button>
        </div>

        {/* Message Input */}
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('tellMeFeeling')}
              disabled={isLoading}
              className="w-full bg-gray-900 text-white px-4 py-3 pr-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 resize-none min-h-[48px] max-h-[120px] transition-all duration-200"
              rows={1}
            />
            {input && (
              <button
                onClick={() => setInput('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-white text-black p-3 rounded-xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0 font-medium"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Full screen loader overlay when creating playlist */}
      {(isCreatingPlaylist || isEditingPlaylist) && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-8 border border-gray-700 text-center max-w-sm mx-4">
            <div className="loader mb-4"></div>
            <h3 className="text-white text-lg font-semibold mb-2">
              {isEditingPlaylist ? 'Editing Playlist' : t('creatingPlaylist')}
            </h3>
            <p className="text-gray-400 text-sm">
              {isEditingPlaylist 
                ? 'Analyzing and modifying your playlist...' 
                : 'Searching for songs and generating your playlist...'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};