'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, TrendingUp, Users, RefreshCw, Play, Plus } from 'lucide-react';
import MatchCard from '@/components/MatchCard';
import BettingSlip from '@/components/BettingSlip';
import UserDashboard from '@/components/UserDashboard';
import WalletConnect from '@/components/WalletConnect';
import ContractStatus from '@/components/ContractStatus';
import OwnerPanel from '@/components/OwnerPanel';
import { useVirtualFootballContract } from '@/hooks/useContract';
import { Match, Bet, Result, League } from '@/types/contract';

export default function Home() {
  const { isConnected } = useAccount();
  const { 
    matches,
    playedMatches,
    unplayedMatches,
    createMatches,
    playMatches,
    placeBet, 
    refetchMatches,
    isWritePending,
    isConfirming,
    isConfirmed,
    getTimeUntilNextGeneration,
    canGenerateMatches,
    isOwner
  } = useVirtualFootballContract();

  const [selectedBets, setSelectedBets] = useState<{matchId: number, prediction: Result}[]>([]);
  const [userBets, setUserBets] = useState<Bet[]>([]);
  const [activeTab, setActiveTab] = useState<'matches' | 'betting' | 'dashboard' | 'owner'>('matches');
  const [timeUntilNext, setTimeUntilNext] = useState(0);

  // Update countdown timer
  useEffect(() => {
    const updateTimer = () => {
      setTimeUntilNext(getTimeUntilNextGeneration());
    };
    
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [getTimeUntilNextGeneration]);

  // Refetch matches when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      refetchMatches();
    }
  }, [isConfirmed, refetchMatches]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCreateMatches = async () => {
    if (!canGenerateMatches) return;
    try {
      await createMatches();
    } catch (error) {
      console.error('Failed to create matches:', error);
    }
  };

  const handlePlayAllMatches = async () => {
    if (unplayedMatches.length === 0) return;
    try {
      const matchIds = unplayedMatches.map(m => m.id);
      await playMatches(matchIds);
    } catch (error) {
      console.error('Failed to play matches:', error);
    }
  };

  const addToBettingSlip = (matchId: number, prediction: Result) => {
    setSelectedBets(prev => {
      const existing = prev.find(bet => bet.matchId === matchId);
      if (existing) {
        return prev.map(bet => 
          bet.matchId === matchId ? { ...bet, prediction } : bet
        );
      }
      return [...prev, { matchId, prediction }];
    });
  };

  const removeFromBettingSlip = (matchId: number) => {
    setSelectedBets(prev => prev.filter(bet => bet.matchId !== matchId));
  };

  const handlePlaceBet = async (betData: { matchIds: number[], predictions: Result[], amount: number }) => {
    try {
      await placeBet(betData.matchIds, betData.predictions, betData.amount.toString());
      setSelectedBets([]);
    } catch (error) {
      console.error('Failed to place bet:', error);
    }
  };

  // Filter matches for betting (only unplayed matches)
  const bettableMatches = unplayedMatches;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Virtual Football</h1>
                <p className="text-slate-400 text-sm">Blockchain Sports Betting</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-6 text-sm">
              {isConnected && (
                <>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Clock className="w-4 h-4" />
                    <span>Next matches: {formatTime(timeUntilNext)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleCreateMatches}
                      disabled={!canGenerateMatches || isWritePending || isConfirming}
                      className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 disabled:opacity-50"
                    >
                      {isWritePending || isConfirming ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Matches
                        </>
                      )}
                    </Button>
                    {unplayedMatches.length > 0 && (
                      <Button
                        onClick={handlePlayAllMatches}
                        disabled={isWritePending || isConfirming}
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
                      >
                        {isWritePending || isConfirming ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Playing...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Play All ({unplayedMatches.length})
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Contract Status */}
        <div className="mb-6">
          <ContractStatus />
        </div>

        {/* Wallet Connection */}
        {!isConnected && (
          <div className="mb-8">
            <WalletConnect />
          </div>
        )}

        {isConnected && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardContent className="flex items-center p-6">
                  <div className="rounded-full bg-emerald-500/20 p-3 mr-4">
                    <Trophy className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{matches.length}</p>
                    <p className="text-slate-400 text-sm">Total Matches</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardContent className="flex items-center p-6">
                  <div className="rounded-full bg-blue-500/20 p-3 mr-4">
                    <Play className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{unplayedMatches.length}</p>
                    <p className="text-slate-400 text-sm">Unplayed Matches</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardContent className="flex items-center p-6">
                  <div className="rounded-full bg-purple-500/20 p-3 mr-4">
                    <TrendingUp className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{selectedBets.length}</p>
                    <p className="text-slate-400 text-sm">Selected Bets</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardContent className="flex items-center p-6">
                  <div className="rounded-full bg-amber-500/20 p-3 mr-4">
                    <Clock className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{formatTime(timeUntilNext)}</p>
                    <p className="text-slate-400 text-sm">Next Round</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 mb-6 bg-slate-800/30 p-1 rounded-lg backdrop-blur-sm">
              {(['matches', 'betting', 'dashboard', ...(isOwner() ? ['owner'] : [])] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {activeTab === 'matches' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-white">All Matches</h2>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          {playedMatches.length} Played
                        </Badge>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {unplayedMatches.length} Pending
                        </Badge>
                      </div>
                    </div>
                    
                    {matches.length === 0 ? (
                      <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <Trophy className="w-16 h-16 text-slate-400 mb-4" />
                          <h3 className="text-lg font-semibold text-white mb-2">No matches available</h3>
                          <p className="text-slate-400 text-sm text-center mb-4">
                            Create new matches to get started
                          </p>
                          <Button
                            onClick={handleCreateMatches}
                            disabled={!canGenerateMatches || isWritePending || isConfirming}
                            className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
                          >
                            {isWritePending || isConfirming ? 'Creating...' : 'Create Matches'}
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      matches.map((match) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          onBet={addToBettingSlip}
                          selectedPrediction={selectedBets.find(bet => bet.matchId === match.id)?.prediction}
                          showBettingButtons={!match.played}
                        />
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'betting' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-white">Place Your Bets</h2>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {bettableMatches.length} Available
                      </Badge>
                    </div>
                    
                    {bettableMatches.length === 0 ? (
                      <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <Trophy className="w-16 h-16 text-slate-400 mb-4" />
                          <h3 className="text-lg font-semibold text-white mb-2">No matches available for betting</h3>
                          <p className="text-slate-400 text-sm text-center">
                            Create new matches or wait for unplayed matches
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      bettableMatches.map((match) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          onBet={addToBettingSlip}
                          selectedPrediction={selectedBets.find(bet => bet.matchId === match.id)?.prediction}
                          bettingMode={true}
                          showBettingButtons={true}
                        />
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'dashboard' && (
                  <UserDashboard bets={userBets} matches={matches} />
                )}

                {activeTab === 'owner' && isOwner() && (
                  <OwnerPanel />
                )}
              </div>

              {/* Betting Slip Sidebar */}
              <div className="lg:col-span-1">
                <BettingSlip
                  selectedBets={selectedBets}
                  matches={bettableMatches}
                  onRemoveBet={removeFromBettingSlip}
                  onPlaceBet={handlePlaceBet}
                  isPlacing={isWritePending || isConfirming}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}