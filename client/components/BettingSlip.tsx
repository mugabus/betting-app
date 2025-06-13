'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, TrendingUp, Wallet, RefreshCw } from 'lucide-react';
import { Match, Result, BetData } from '@/types/contract';

interface BettingSlipProps {
  selectedBets: {matchId: number, prediction: Result}[];
  matches: Match[];
  onRemoveBet: (matchId: number) => void;
  onPlaceBet: (betData: BetData) => void;
  isPlacing?: boolean;
}

const resultLabels = {
  [Result.TeamAWin]: 'Home Win',
  [Result.TeamBWin]: 'Away Win',
  [Result.Draw]: 'Draw'
};

export default function BettingSlip({ selectedBets, matches, onRemoveBet, onPlaceBet, isPlacing = false }: BettingSlipProps) {
  const [betAmount, setBetAmount] = useState<string>('');

  const getMatchById = (id: number) => matches.find(m => m.id === id);

  const calculateTotalOdds = () => {
    // Fixed 2x payout from contract
    return 2.0;
  };

  const totalOdds = calculateTotalOdds();
  const potentialWin = parseFloat(betAmount) * totalOdds || 0;

  const handlePlaceBet = () => {
    if (!betAmount || selectedBets.length === 0) return;

    onPlaceBet({
      matchIds: selectedBets.map(bet => bet.matchId),
      predictions: selectedBets.map(bet => bet.prediction),
      amount: parseFloat(betAmount)
    });

    setBetAmount('');
  };

  return (
    <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm sticky top-24">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-white">
          <TrendingUp className="w-5 h-5 mr-2 text-emerald-400" />
          Betting Slip
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {selectedBets.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-400 text-sm">
              Select match outcomes to build your betting slip
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedBets.map((bet) => {
              const match = getMatchById(bet.matchId);
              if (!match) return null;

              return (
                <div key={bet.matchId} className="bg-slate-700/30 rounded-lg p-3 relative">
                  <button
                    onClick={() => onRemoveBet(bet.matchId)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors"
                    disabled={isPlacing}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  <div className="text-sm text-white font-medium mb-1">
                    {match.teamA} vs {match.teamB}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                      {resultLabels[bet.prediction]}
                    </Badge>
                    <span className="text-slate-300 text-sm font-semibold">
                      2.0x
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="border-t border-slate-600 pt-4 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Payout Multiplier:</span>
                <span className="text-white font-semibold">{totalOdds.toFixed(1)}x</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-400">Bet Amount (ETH)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                  disabled={isPlacing}
                />
              </div>

              {betAmount && (
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Potential Win:</span>
                    <span className="text-emerald-400 font-semibold">
                      {potentialWin.toFixed(4)} ETH
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Profit:</span>
                    <span className="text-slate-300">
                      {(potentialWin - parseFloat(betAmount)).toFixed(4)} ETH
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={handlePlaceBet}
                disabled={!betAmount || selectedBets.length === 0 || isPlacing}
                className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlacing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Placing Bet...
                  </>
                ) : (
                  `Place Bet (${selectedBets.length} selections)`
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}