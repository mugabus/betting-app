'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { Bet, Match, Result } from '@/types/contract';

interface UserDashboardProps {
  bets: Bet[];
  matches: Match[];
}

const resultLabels = {
  [Result.TeamAWin]: 'Home Win',
  [Result.TeamBWin]: 'Away Win',
  [Result.Draw]: 'Draw'
};

export default function UserDashboard({ bets, matches }: UserDashboardProps) {
  const getMatchById = (id: number) => matches.find(m => m.id === id);

  const checkBetStatus = (bet: Bet) => {
    const allMatchesPlayed = bet.matchIds.every(id => {
      const match = getMatchById(id);
      return match?.played;
    });

    if (!allMatchesPlayed) return 'pending';

    const allCorrect = bet.matchIds.every((matchId, index) => {
      const match = getMatchById(matchId);
      return match?.result === bet.predictions[index];
    });

    return allCorrect ? 'winning' : 'losing';
  };

  const mockBets: Bet[] = [
    {
      id: 1,
      matchIds: [1, 2],
      predictions: [Result.TeamAWin, Result.Draw],
      bettor: '0x1234...5678',
      amount: 0.1,
      claimed: false
    },
    {
      id: 2,
      matchIds: [3],
      predictions: [Result.TeamBWin],
      bettor: '0x1234...5678',
      amount: 0.05,
      claimed: true
    }
  ];

  const allBets = [...bets, ...mockBets];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">My Bets</h2>
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
          {allBets.length} Total Bets
        </Badge>
      </div>

      {allBets.length === 0 ? (
        <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No bets yet</h3>
            <p className="text-slate-400 text-sm text-center">
              Place your first bet on upcoming matches to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {allBets.map((bet, index) => {
            const status = checkBetStatus(bet);
            const potentialWin = bet.amount * 2; // Mock 2x multiplier

            return (
              <Card key={bet.id || index} className="bg-slate-800/30 border-slate-700 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white">
                      Bet #{bet.id || index + 1}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        className={`${
                          status === 'winning' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          status === 'losing' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {status === 'winning' ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Winning
                          </>
                        ) : status === 'losing' ? (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Lost
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </>
                        )}
                      </Badge>
                      {bet.claimed && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Claimed
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {bet.matchIds.map((matchId, matchIndex) => {
                      const match = getMatchById(matchId);
                      const prediction = bet.predictions[matchIndex];
                      
                      if (!match) return null;

                      const isCorrect = match.played && match.result === prediction;

                      return (
                        <div key={matchId} className="bg-slate-700/30 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white text-sm font-medium">
                              {match.teamA} vs {match.teamB}
                            </span>
                            {match.played && (
                              <div className="flex items-center space-x-1">
                                {isCorrect ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-400" />
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">
                              {resultLabels[prediction]}
                            </Badge>
                            {match.played && (
                              <span className="text-slate-300 text-xs">
                                Result: {match.goalsA} - {match.goalsB}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <div className="border-t border-slate-600 pt-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-400 text-sm">Bet Amount:</span>
                        <span className="text-white font-semibold">{bet.amount} ETH</span>
                      </div>
                      
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-slate-400 text-sm">Potential Win:</span>
                        <span className="text-emerald-400 font-semibold">{potentialWin} ETH</span>
                      </div>

                      {status === 'winning' && !bet.claimed && (
                        <Button 
                          className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
                          onClick={() => console.log('Claiming bet:', bet.id)}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Claim Winnings
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}