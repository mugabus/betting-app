'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Trophy, AlertCircle } from 'lucide-react';
import { Match, Result, League } from '@/types/contract';

interface MatchCardProps {
  match: Match;
  onBet?: (matchId: number, prediction: Result) => void;
  selectedPrediction?: Result;
  bettingMode?: boolean;
  showBettingButtons?: boolean;
}

const leagueColors = {
  [League.LaLiga]: 'bg-red-500/20 text-red-400 border-red-500/30',
  [League.PremierLeague]: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  [League.SerieA]: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
};

const leagueNames = {
  [League.LaLiga]: 'La Liga',
  [League.PremierLeague]: 'Premier League',
  [League.SerieA]: 'Serie A'
};

const resultLabels = {
  [Result.TeamAWin]: 'Home Win',
  [Result.TeamBWin]: 'Away Win',
  [Result.Draw]: 'Draw'
};

export default function MatchCard({ 
  match, 
  onBet, 
  selectedPrediction, 
  bettingMode = false, 
  showBettingButtons = false 
}: MatchCardProps) {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResultIcon = (result: Result) => {
    if (result === match.result && match.played) {
      return <Trophy className="w-4 h-4 text-emerald-400" />;
    }
    return null;
  };

  const getBettingOdds = () => {
    // Fixed 2x payout from contract
    return {
      [Result.TeamAWin]: 2.0,
      [Result.Draw]: 2.0,
      [Result.TeamBWin]: 2.0
    };
  };

  const odds = getBettingOdds();

  return (
    <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm hover:bg-slate-800/50 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Badge className={leagueColors[match.league]}>
              {leagueNames[match.league]}
            </Badge>
            {!match.played && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                <AlertCircle className="w-3 h-3 mr-1" />
                Pending
              </Badge>
            )}
          </div>
          <div className="flex items-center text-slate-400 text-sm">
            <Clock className="w-4 h-4 mr-1" />
            {formatTime(match.startTime)}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">{match.teamA}</h3>
            {match.played && (
              <div className="text-3xl font-bold text-emerald-400">{match.goalsA}</div>
            )}
          </div>
          
          <div className="px-4">
            <div className="text-slate-400 text-sm text-center mb-2">
              {match.played ? 'FT' : 'VS'}
            </div>
            {match.played && match.result !== Result.NotSet && (
              <div className="flex items-center justify-center">
                {getResultIcon(match.result)}
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">{match.teamB}</h3>
            {match.played && (
              <div className="text-3xl font-bold text-emerald-400">{match.goalsB}</div>
            )}
          </div>
        </div>

        {match.played && !bettingMode && match.result !== Result.NotSet && (
          <div className="flex justify-center">
            <Badge 
              className={`${
                match.result === Result.TeamAWin ? 'bg-emerald-500/20 text-emerald-400' :
                match.result === Result.TeamBWin ? 'bg-blue-500/20 text-blue-400' :
                'bg-amber-500/20 text-amber-400'
              } border-0`}
            >
              {resultLabels[match.result]}
            </Badge>
          </div>
        )}

        {showBettingButtons && onBet && (
          <div className="grid grid-cols-3 gap-2">
            {[Result.TeamAWin, Result.Draw, Result.TeamBWin].map((result) => (
              <Button
                key={result}
                variant={selectedPrediction === result ? "default" : "outline"}
                size="sm"
                onClick={() => onBet(match.id, result)}
                className={`${
                  selectedPrediction === result 
                    ? 'bg-gradient-to-r from-emerald-500 to-blue-600 border-0' 
                    : 'border-slate-600 text-slate-300 hover:bg-slate-700/50'
                } transition-all duration-200`}
              >
                <div className="text-center">
                  <div className="text-xs opacity-80">
                    {result === Result.TeamAWin ? '1' : result === Result.Draw ? 'X' : '2'}
                  </div>
                  <div className="font-semibold">{odds[result]}x</div>
                </div>
              </Button>
            ))}
          </div>
        )}

        {!match.played && !showBettingButtons && (
          <div className="text-center">
            <Badge className="bg-slate-700/50 text-slate-400 border-slate-600">
              Match not played yet
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}