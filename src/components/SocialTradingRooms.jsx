import React, { useState, useEffect, useRef } from 'react'
import { useMarketData } from '../contexts/MarketDataContext.jsx'

/**
 * Social Trading Rooms - Real-time collaboration
 * Next-gen social trading for 2025
 */
export default function SocialTradingRooms({ onClose }) {
  const [activeRoom, setActiveRoom] = useState(null)
  const [rooms, setRooms] = useState([
    {
      id: 'elite-traders',
      name: 'Elite Traders',
      description: 'Top 1% performers only',
      members: 142,
      online: 38,
      performance: '+127%',
      restricted: true,
      avatar: '🏆'
    },
    {
      id: 'day-traders',
      name: 'Day Trading Masters',
      description: 'High frequency, high volume',
      members: 892,
      online: 234,
      performance: '+45%',
      restricted: false,
      avatar: '⚡'
    },
    {
      id: 'algo-lab',
      name: 'Algorithm Laboratory',
      description: 'Quant strategies & bots',
      members: 456,
      online: 89,
      performance: '+89%',
      restricted: false,
      avatar: '🤖'
    },
    {
      id: 'crypto-whales',
      name: 'Crypto Whales',
      description: 'Large cap crypto trading',
      members: 2341,
      online: 567,
      performance: '+234%',
      restricted: false,
      avatar: '🐋'
    },
    {
      id: 'options-pit',
      name: 'Options Trading Pit',
      description: 'Advanced derivatives',
      members: 334,
      online: 78,
      performance: '+67%',
      restricted: true,
      avatar: '🎯'
    }
  ])
  const [messages, setMessages] = useState([])
  const [participants, setParticipants] = useState([])
  const [sharedTrades, setSharedTrades] = useState([])
  const [userMessage, setUserMessage] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [roomStats, setRoomStats] = useState({})
  const messagesEndRef = useRef(null)
  const { marketData } = useMarketData()

  // Simulate real-time room activity
  useEffect(() => {
    if (!activeRoom) return

    // Load room data
    loadRoomData(activeRoom)

    // Simulate incoming messages
    const messageInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        addSystemMessage()
      }
    }, 5000)

    // Simulate trade shares
    const tradeInterval = setInterval(() => {
      if (Math.random() > 0.8) {
        addSharedTrade()
      }
    }, 8000)

    return () => {
      clearInterval(messageInterval)
      clearInterval(tradeInterval)
    }
  }, [activeRoom]) // Dependencies are functions defined inside component, this is intentional

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadRoomData = (roomId) => {
    // Simulate loading room participants
    const mockParticipants = [
      { id: 1, name: 'TradeMaster', avatar: '🎯', status: 'online', profit: '+45%', trades: 234 },
      { id: 2, name: 'QuantKing', avatar: '👑', status: 'online', profit: '+89%', trades: 567 },
      { id: 3, name: 'BullRunner', avatar: '🐂', status: 'away', profit: '+23%', trades: 123 },
      { id: 4, name: 'AlgoWhiz', avatar: '🤖', status: 'online', profit: '+156%', trades: 891 },
      { id: 5, name: 'You', avatar: '🦄', status: 'online', profit: '+34%', trades: 45 }
    ]
    setParticipants(mockParticipants)

    // Load initial messages
    const welcomeMessages = [
      {
        id: Date.now(),
        type: 'system',
        text: `Welcome to ${rooms.find(r => r.id === roomId)?.name}!`,
        timestamp: new Date()
      },
      {
        id: Date.now() + 1,
        type: 'user',
        user: 'TradeMaster',
        avatar: '🎯',
        text: 'NVDA looking strong above 500, watching for breakout',
        timestamp: new Date(Date.now() - 60000)
      },
      {
        id: Date.now() + 2,
        type: 'user',
        user: 'QuantKing',
        avatar: '👑',
        text: 'My algo just triggered a BUY signal on TSLA',
        timestamp: new Date(Date.now() - 30000)
      }
    ]
    setMessages(welcomeMessages)

    // Load room stats
    setRoomStats({
      totalVolume: '$2.4M',
      winRate: '67%',
      avgReturn: '+12.3%',
      topTrade: 'NVDA +45%'
    })
  }

  const addSystemMessage = () => {
    const events = [
      'New member joined the room',
      'TradeMaster shared a trade',
      'Market alert: SPY breaking resistance',
      'QuantKing achieved 10-trade win streak',
      'Room performance updated: +2.3% today'
    ]

    const message = {
      id: Date.now(),
      type: 'system',
      text: events[Math.floor(Math.random() * events.length)],
      timestamp: new Date()
    }

    setMessages(prev => [...prev, message])
  }

  const addSharedTrade = () => {
    const trades = [
      { symbol: 'AAPL', action: 'BUY', price: 178.50, user: 'TradeMaster', profit: null },
      { symbol: 'TSLA', action: 'SELL', price: 245.80, user: 'QuantKing', profit: '+12%' },
      { symbol: 'SPY', action: 'BUY', price: 450.25, user: 'AlgoWhiz', profit: null },
      { symbol: 'NVDA', action: 'SELL', price: 512.40, user: 'BullRunner', profit: '+8%' }
    ]

    const trade = trades[Math.floor(Math.random() * trades.length)]
    trade.id = Date.now()
    trade.timestamp = new Date()

    setSharedTrades(prev => [trade, ...prev.slice(0, 4)])

    // Add message about the trade
    const message = {
      id: Date.now(),
      type: 'trade',
      user: trade.user,
      trade,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
  }

  const sendMessage = () => {
    if (!userMessage.trim() || !activeRoom) return

    const message = {
      id: Date.now(),
      type: 'user',
      user: 'You',
      avatar: '🦄',
      text: userMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, message])
    setUserMessage('')

    // Simulate response
    if (userMessage.includes('?')) {
      setTimeout(() => {
        const response = {
          id: Date.now(),
          type: 'user',
          user: 'TradeMaster',
          avatar: '🎯',
          text: 'Great question! Based on the technicals, I see support at 175',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, response])
      }, 2000)
    }
  }

  const joinRoom = (roomId) => {
    setActiveRoom(roomId)
    setMessages([])
    setSharedTrades([])
  }

  const copyTrade = (trade) => {
    window.dispatchEvent(new CustomEvent('iava.quickTrade', {
      detail: {
        action: trade.action.toLowerCase(),
        symbol: trade.symbol,
        source: 'social_room'
      }
    }))

    window.dispatchEvent(new CustomEvent('iava.toast', {
      detail: { text: `Copying ${trade.user}'s trade: ${trade.action} ${trade.symbol}`, type: 'info' }
    }))
  }

  const startScreenShare = () => {
    setIsStreaming(true)
    window.dispatchEvent(new CustomEvent('iava.toast', {
      detail: { text: 'Screen sharing started', type: 'success' }
    }))
  }

  if (!activeRoom) {
    // Room selection view
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-4xl bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl shadow-2xl overflow-hidden">
          {/* Holographic effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 via-purple-500/10 to-pink-500/10 animate-gradient-shift pointer-events-none" />

          <div className="relative p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">Social Trading Rooms</h2>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Demo Data
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => joinRoom(room.id)}
                  className="relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-xl p-4 text-left transition-all group"
                >
                  {room.restricted && (
                    <div className="absolute top-2 right-2">
                      <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full">
                        🔒 Restricted
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">{room.avatar}</div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                        {room.name}
                      </h3>
                      <p className="text-xs text-slate-500">{room.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900/50 rounded p-2">
                      <div className="text-slate-500">Members</div>
                      <div className="text-white font-medium">{room.members}</div>
                    </div>
                    <div className="bg-slate-900/50 rounded p-2">
                      <div className="text-slate-500">Online</div>
                      <div className="text-emerald-400 font-medium">{room.online}</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Avg Performance</span>
                      <span className="text-sm font-bold text-emerald-400">{room.performance}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚀</span>
                <div>
                  <div className="font-semibold text-white">Create Your Own Room</div>
                  <div className="text-sm text-slate-400">Start your own trading community</div>
                </div>
                <button className="ml-auto px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-all">
                  Create Room
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Active room view
  const room = rooms.find(r => r.id === activeRoom)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-6xl h-[80vh] bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl shadow-2xl overflow-hidden flex">
        {/* Participants Sidebar */}
        <div className="w-64 border-r border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Participants ({participants.length})</h3>
            <div className="space-y-2">
              {participants.map(participant => (
                <div key={participant.id} className="flex items-center gap-2 p-2 hover:bg-slate-800/50 rounded transition-colors">
                  <div className="relative">
                    <span className="text-xl">{participant.avatar}</span>
                    <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-slate-900 ${
                      participant.status === 'online' ? 'bg-emerald-500' :
                      participant.status === 'away' ? 'bg-amber-500' :
                      'bg-slate-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{participant.name}</div>
                    <div className="text-xs text-emerald-400">{participant.profit}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shared Trades */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Live Trades</h3>
            <div className="space-y-2">
              {sharedTrades.map(trade => (
                <div key={trade.id} className="bg-slate-800/50 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${
                      trade.action === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {trade.action} {trade.symbol}
                    </span>
                    {trade.profit && (
                      <span className="text-xs text-emerald-400">{trade.profit}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{trade.user}</span>
                    <button
                      onClick={() => copyTrade(trade)}
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Room Header */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveRoom(null)}
                  className="p-1 hover:bg-slate-800 rounded transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-2xl">{room.avatar}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{room.name}</h2>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Demo
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">{room.online} online • {room.performance} avg</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={startScreenShare}
                  className={`p-2 rounded-lg transition-all ${
                    isStreaming
                      ? 'bg-red-500/20 text-red-400 animate-pulse'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Share screen"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Room Stats */}
            <div className="flex items-center gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Volume:</span>
                <span className="text-white font-medium">{roomStats.totalVolume}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Win Rate:</span>
                <span className="text-emerald-400 font-medium">{roomStats.winRate}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Avg Return:</span>
                <span className="text-cyan-400 font-medium">{roomStats.avgReturn}</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map(message => (
              <div key={message.id} className={`${
                message.type === 'system' ? 'text-center' : ''
              }`}>
                {message.type === 'system' ? (
                  <span className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">
                    {message.text}
                  </span>
                ) : message.type === 'trade' ? (
                  <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-purple-400">{message.user}</span>
                      <span className="text-slate-400">shared a trade:</span>
                      <span className={`font-bold ${
                        message.trade.action === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {message.trade.action} {message.trade.symbol}
                      </span>
                      {message.trade.profit && (
                        <span className="text-emerald-400">({message.trade.profit})</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{message.avatar}</span>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-white">{message.user}</span>
                        <span className="text-xs text-slate-500">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm text-slate-300 mt-1">{message.text}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
              <button
                onClick={sendMessage}
                className="px-6 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg font-medium transition-all"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}