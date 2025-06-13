'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, TrendingUp, Users } from 'lucide-react';
import MatchCard from '@/components/MatchCard';
import BettingSlip from '@/components/BettingSlip';
import UserDashboard from '@/components/UserDashboard';
import { Match, Bet, Result, League } from '@/types/contract';

// Mock data - replace with actual contract integration
const mockMatches: Match[] = [
  {
    id: 1,
    league: League.LaLiga,
    teamA: 'Barcelona',
    teamB: 'Real Madrid',
    goalsA: 2,
    goalsB: 1,
    result: Result.TeamAWin,
    startTime: Date.now() - 1000000,
    played: true
  },
  {
    id: 2,
    league: League.PremierLeague,
    teamA: 'Manchester City',
    teamB: 'Liverpool',
    goalsA: 1,
    goalsB: 1,
    result: Result.Draw,
    startTime: Date.now() - 800000,
    played: true
  },
  {
    id: 3,
    league: League.SerieA,
    teamA: 'Juventus',
    teamB: 'AC Milan',
    goalsA: 0,
    goalsB: 2,
    result: Result.TeamBWin,
    startTime: Date.now() - 600000,
    played: true
  }
];

export default function Home() {
  const [matches, setMatches] = useState<Match[]>(mockMatches);
  const [selectedBets, setSelectedBets] = useState<{matchId: number, prediction: Result}[]>([]);
  const [userBets, setUserBets] = useState<Bet[]>([]);
  const [activeTab, setActiveTab] = useState<'matches' | 'betting' | 'dashboard'>('matches');
  const [timeUntilNext, setTimeUntilNext] = useState(300); // 5 minutes in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilNext(prev => prev > 0 ? prev - 1 : 300);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGenerateMatches = async () => {
    // Mock function - replace with actual contract call
    console.log('Generating new matches...');
    setTimeUntilNext(300);
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
              <div className="flex items-center space-x-2 text-slate-300">
                <Clock className="w-4 h-4" />
                <span>Next matches: {formatTime(timeUntilNext)}</span>
              </div>
              <Button
                onClick={handleGenerateMatches}
                disabled={timeUntilNext > 0}
                className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
              >
                Generate Matches
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
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
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{userBets.length}</p>
                <p className="text-slate-400 text-sm">Active Bets</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="flex items-center p-6">
              <div className="rounded-full bg-purple-500/20 p-3 mr-4">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">2.4x</p>
                <p className="text-slate-400 text-sm">Payout Rate</p>
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
          {(['matches', 'betting', 'dashboard'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
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
                  <h2 className="text-xl font-bold text-white">Latest Matches</h2>
                  <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    Live Results
                  </Badge>
                </div>
                
                {matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onBet={addToBettingSlip}
                    selectedPrediction={selectedBets.find(bet => bet.matchId === match.id)?.prediction}
                  />
                ))}
              </div>
            )}

            {activeTab === 'betting' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white mb-6">Place Your Bets</h2>
                {matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onBet={addToBettingSlip}
                    selectedPrediction={selectedBets.find(bet => bet.matchId === match.id)?.prediction}
                    bettingMode={true}
                  />
                ))}
              </div>
            )}

            {activeTab === 'dashboard' && (
              <UserDashboard bets={userBets} matches={matches} />
            )}
          </div>

          {/* Betting Slip Sidebar */}
          <div className="lg:col-span-1">
            <BettingSlip
              selectedBets={selectedBets}
              matches={matches}
              onRemoveBet={removeFromBettingSlip}
              onPlaceBet={(betData) => {
                console.log('Placing bet:', betData);
                setSelectedBets([]);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}