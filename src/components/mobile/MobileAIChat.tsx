import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Music, X, Loader, List, Plus, Check } from 'lucide-react';
import { AIMessage, SpotifyAuthState, Playlist } from '../../types';
import { geminiApi } from '../../services/geminiApi';

interface MobileAIChatProps {
  messages: AIMessage[];
  onMessagesUpdate: (messages: AIMessage[]) => void;
  onPlaylistGenerated: (songs: string[], source?: 'youtube' | 'spotify') => Promise<any>;
  isCreatingPlaylist: boolean;
  spotifyAuthState: SpotifyAuthState;
  playlists: Playlist[];
}

export const MobileAIChat: React.FC<MobileAIChatProps> = ({
  messages,
  onMessagesUpdate,
  onPlaylistGenerated,
  isCreatingPlaylist,
  spotifyAuthState,
  playlists
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [playlistSource, setPlaylistSource] = useState<'youtube' | 'spotify'>('youtube');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [isEditingPlaylist, setIsEditingPlaylist] = useState(false);
  const [createdPlaylist, setCreatedPlaylist] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px';
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
      const context = messages.slice(-3).map(msg => `${msg.sender}: ${msg.content}`).join('\n');
      const playlistContext = selectedPlaylist ? `Currently editing playlist: "${selectedPlaylist.name}" with ${selectedPlaylist.songs.length} songs` : '';
      const fullContext = `${context}\n${playlistContext}`;
      const aiResponse = await geminiApi.chatWithAI(userInput, fullContext);

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

      if (shouldEditPlaylist && selectedPlaylist) {
        const editingMessage: AIMessage = {
          id: (Date.now() + 2).toString(),
          content: `🎵 Editing "${selectedPlaylist.name}"... Let me modify it based on your request!`,
          sender: 'ai',
          timestamp: new Date()
        };
        onMessagesUpdate([...newMessages, aiMessage, editingMessage]);
        
        setIsEditingPlaylist(true);
        
        try {
          const editInstructions = await geminiApi.generatePlaylistEdit(userInput, selectedPlaylist);
          
          if (editInstructions) {
            let updatedPlaylist = { ...selectedPlaylist };
            let changes: string[] = [];
            
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
            
            if (editInstructions.songsToAdd && editInstructions.songsToAdd.length > 0) {
              const newSongs = await geminiApi.generatePlaylist('', editInstructions.songsToAdd.join(', '), playlistSource);
              if (newSongs && newSongs.length > 0) {
                const playlist = await onPlaylistGenerated(newSongs, playlistSource);
                if (playlist && playlist.songs) {
                  const existingSongIds = new Set(updatedPlaylist.songs.map(s => s.id));
                  const songsToAdd = playlist.songs.filter(song => !existingSongIds.has(song.id));
                  
                  updatedPlaylist.songs = [...updatedPlaylist.songs, ...songsToAdd];
                  songsToAdd.forEach(song => {
                    changes.push(`✅ Added: ${song.title} - ${song.artist}`);
                  });
                }
              }
            }
            
            updatedPlaylist.updatedAt = new Date();
            if (editInstructions.newDescription) {
              updatedPlaylist.description = editInstructions.newDescription;
            }
            
            setSelectedPlaylist(updatedPlaylist);
            
            const successMessage: AIMessage = {
              id: (Date.now() + 3).toString(),
              content: `🎉 Successfully updated "${updatedPlaylist.name}"!

📝 Changes made:
${changes.length > 0 ? changes.slice(0, 8).join('\n') : '• No specific songs were changed'}
${changes.length > 8 ? `\n... and ${changes.length - 8} more changes!` : ''}

🎵 Your playlist now has ${updatedPlaylist.songs.length} songs!`,
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
            content: `😅 Sorry, I had trouble editing that playlist. Could you try being more specific?`,
            sender: 'ai',
            timestamp: new Date()
          };
          onMessagesUpdate([...newMessages, aiMessage, errorMessage]);
        } finally {
          setIsEditingPlaylist(false);
        }
      } else if (shouldCreatePlaylist) {
        const creatingMessage: AIMessage = {
          id: (Date.now() + 2).toString(),
          content: `🎵 Creating your playlist from ${playlistSource === 'spotify' ? 'Spotify' : 'YouTube'}... This might take a moment!`,
          sender: 'ai',
          timestamp: new Date()
        };
        onMessagesUpdate([...newMessages, aiMessage, creatingMessage]);

        try {
          const songs = await geminiApi.generatePlaylist(userInput, '', playlistSource);
          
          if (songs && songs.length > 0) {
            const playlist = await onPlaylistGenerated(songs, playlistSource);
            
            if (playlist) {
              setCreatedPlaylist(playlist);
              
              const successMessage: AIMessage = {
                id: (Date.now() + 3).toString(),
                content: `🎉 Perfect! I've created "${playlist.name}" with ${playlist.songs.length} songs!

📝 Songs added:
${playlist.songs.slice(0, 4).map((song: any) => `• ${song.title} - ${song.artist}`).join('\n')}
${playlist.songs.length > 4 ? `\n... and ${playlist.songs.length - 4} more songs!` : ''}

🎵 You can find it in your library!`,
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
            content: `😅 Sorry, I had trouble creating that playlist. Could you try being more specific?`,
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
    
    const playlistKeywords = [
      'playlist', 'create', 'generate', 'make', 'songs', 'music',
      'feeling', 'mood', 'happy', 'sad', 'energetic', 'chill', 'relax',
      'party', 'workout', 'study', 'romantic', 'dance', 'rock', 'pop',
      'jazz', 'classical', 'hip hop', 'electronic', 'indie', 'acoustic'
    ];
    
    const aiIndicators = [
      'creating', 'i\'ll create', 'let me create', 'i\'m creating',
      'generating', 'i\'ll generate', 'perfect!', 'great!'
    ];
    
    const hasPlaylistKeyword = playlistKeywords.some(keyword => input.includes(keyword));
    const hasAIIndicator = aiIndicators.some(indicator => response.includes(indicator));
    const isDirectRequest = input.includes('create') || input.includes('make') || input.includes('generate');
    const mentionsMusic = input.includes('music') || input.includes('song');
    
    return hasPlaylistKeyword || hasAIIndicator || (isDirectRequest && mentionsMusic);
  };

  const checkIfShouldEditPlaylist = (userInput: string, aiResponse: string): boolean => {
    const input = userInput.toLowerCase();
    const response = aiResponse.toLowerCase();
    
    const editKeywords = [
      'add', 'remove', 'delete', 'change', 'modify', 'edit', 'update',
      'make it', 'make this', 'more', 'less', 'sadder', 'happier',
      'energetic', 'calm', 'upbeat', 'slow', 'fast'
    ];
    
    const aiEditIndicators = [
      'editing', 'i\'ll edit', 'let me edit', 'i\'m editing',
      'modifying', 'i\'ll modify', 'updating', 'changing'
    ];
    
    const hasEditKeyword = editKeywords.some(keyword => input.includes(keyword));
    const hasAIEditIndicator = aiEditIndicators.some(indicator => response.includes(indicator));
    const isEditRequest = input.includes('this playlist') || input.includes('the playlist');
    
    return hasEditKeyword || hasAIEditIndicator || isEditRequest;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePlaylistSelect = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setShowPlaylistSelector(false);
    
    const selectionMessage: AIMessage = {
      id: Date.now().toString(),
      content: `🎵 Selected playlist: "${playlist.name}" (${playlist.songs.length} songs)
      
Now you can ask me to modify it! Try saying:
• "Make this playlist sadder"
• "Add more upbeat songs"
• "Remove slow songs"`,
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
• "Make me a rock playlist"`,
      sender: 'ai',
      timestamp: new Date()
    };
    
    onMessagesUpdate([...messages, createMessage]);
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
      } catch (error) {
        console.error('Error dispatching goToPlaylist event:', error);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-black relative h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-12 pb-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-white">BuggyAI</h1>
          <button
            onClick={() => setShowPlaylistSelector(true)}
            className="p-2 bg-gray-800 rounded-lg text-gray-400 active:text-white transition-colors active:scale-95"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
        <p className="text-gray-400 text-sm mb-2">Ask me to create playlists based on your mood!</p>
        
        {/* Selected Playlist Info */}
        {selectedPlaylist && (
          <div className="mt-2 p-3 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Music className="w-3 h-3 text-blue-400" />
                <span className="text-blue-300 font-medium text-sm">Editing: {selectedPlaylist.name}</span>
              </div>
              <button
                onClick={() => setSelectedPlaylist(null)}
                className="text-blue-400 active:text-blue-300 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 mobile-scroll" style={{ 
        WebkitOverflowScrolling: 'touch', 
        overscrollBehavior: 'contain',
        height: 'calc(100vh - 220px)'
      }}>
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-4 text-sm">Ask me to create playlists based on your mood!</p>
            <div className="space-y-3">
              <button
                onClick={() => setInput('Create a workout playlist')}
                className="w-full p-3 bg-gray-800 active:bg-gray-700 rounded-lg text-sm text-left transition-colors"
              >
                🏋️ Create a workout playlist
              </button>
              <button
                onClick={() => setInput('I want relaxing music')}
                className="w-full p-3 bg-gray-800 active:bg-gray-700 rounded-lg text-sm text-left transition-colors"
              >
                😌 I want relaxing music
              </button>
              <button
                onClick={() => setInput('Make me a rock playlist')}
                className="w-full p-3 bg-gray-800 active:bg-gray-700 rounded-lg text-sm text-left transition-colors"
              >
                🎸 Make me a rock playlist
              </button>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-3 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                message.sender === 'user' ? 'bg-blue-600' : 'bg-gray-700'
              }`}>
                {message.sender === 'user' ? (
                  <User className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-white" />
                )}
              </div>
              <div className={`px-3 py-2 rounded-xl ${
                message.sender === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-white'
              }`}>
                <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                  {message.content}
                </div>
                <span className="text-xs mt-1 block opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-gray-800 px-3 py-2 rounded-xl">
                <div className="flex items-center space-x-2">
                  <Loader className="w-3.5 h-3.5 animate-spin text-white" />
                  <span className="text-white text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Go to Playlist Button */}
      {createdPlaylist && (
        <div className="flex-shrink-0 border-t border-gray-800 p-3 bg-gray-900">
          <button
            onClick={handleGoToPlaylist}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl active:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm font-medium active:scale-95"
          >
            <Music className="w-4 h-4" />
            <span>Go to "{createdPlaylist.name}"</span>
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-gray-800 p-3 bg-black">
        {/* Source Selection */}
        <div className="flex items-center justify-center space-x-3 mb-3">
          <span className="text-gray-400 text-sm">Create from:</span>
          <div className="flex bg-gray-800 rounded-full p-0.5">
            <button
              onClick={() => setPlaylistSource('youtube')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                playlistSource === 'youtube'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-300'
              }`}
            >
              YouTube
            </button>
            <button
              onClick={() => setPlaylistSource('spotify')}
              disabled={!spotifyAuthState?.isAuthenticated}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                playlistSource === 'spotify'
                  ? 'bg-green-600 text-white'
                  : spotifyAuthState?.isAuthenticated 
                    ? 'text-gray-300'
                    : 'text-gray-500'
              }`}
            >
              Spotify
            </button>
          </div>
        </div>

        {/* Message Input */}
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tell me how you're feeling..."
              disabled={isLoading}
              className="w-full bg-gray-800 text-white px-4 py-3 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 resize-none min-h-[44px] max-h-[100px] transition-all duration-200 text-sm"
              rows={1}
            />
            {input && (
              <button
                onClick={() => setInput('')}
                className="absolute right-3 top-3 text-gray-400 active:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-11 h-11 bg-blue-600 text-white rounded-xl flex items-center justify-center active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Playlist Selector Modal */}
      {showPlaylistSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50" onClick={() => setShowPlaylistSelector(false)}>
          <div className="bg-gray-900 rounded-t-xl w-full max-h-[65vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-2.5 border-b border-gray-700">
              <h3 className="text-white font-semibold text-xs">Select Playlist to Edit</h3>
              <button
                onClick={() => setShowPlaylistSelector(false)}
                className="text-gray-400 active:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="p-2.5">
              <button
                onClick={handleCreateNewPlaylist}
                className="w-full p-2 bg-green-600 text-white rounded-lg active:bg-green-700 transition-colors flex items-center space-x-2 mb-2 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <div className="text-left">
                  <div className="font-medium">Create New Playlist</div>
                  <div className="text-xs opacity-90">Start fresh with AI-generated music</div>
                </div>
              </button>
              
              <div className="space-y-1 max-h-40 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                <h4 className="text-gray-400 text-xs font-medium mb-1">Or edit existing playlist:</h4>
                {playlists.length > 0 ? (
                  playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => handlePlaylistSelect(playlist)}
                      className={`w-full p-2 rounded-lg transition-colors text-left flex items-center space-x-2 ${
                        selectedPlaylist?.id === playlist.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 active:bg-gray-700'
                      }`}
                    >
                      <div className="w-7 h-7 bg-gray-700 rounded-lg flex items-center justify-center">
                        {playlist.isAIGenerated ? (
                          <Bot className="w-3 h-3 text-white" />
                        ) : (
                          <Music className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-xs">{playlist.name}</div>
                        <div className="text-xs opacity-75 truncate">
                          {playlist.songs.length} songs
                          {playlist.isAIGenerated && ' • AI Generated'}
                        </div>
                      </div>
                      {selectedPlaylist?.id === playlist.id && (
                        <Check className="w-3.5 h-3.5 text-white" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    <Music className="w-5 h-5 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No playlists found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Creating Playlist Overlay */}
      {(isCreatingPlaylist || isEditingPlaylist) && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-700 text-center max-w-xs mx-4">
            <div className="w-10 h-10 border-4 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-2"></div>
            <h3 className="text-white text-xs font-semibold mb-1">
              {isEditingPlaylist ? 'Editing Playlist' : 'Creating Playlist'}
            </h3>
            <p className="text-gray-400 text-xs">
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