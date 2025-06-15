'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Crown, DollarSign, Play, RefreshCw, AlertTriangle } from 'lucide-react';
import { useVirtualFootballContract } from '@/hooks/useContract';
import { formatEther } from 'viem';
import { useBalance } from 'wagmi';
import { CONTRACT_ADDRESS } from '@/lib/contract';

export default function OwnerPanel() {
  const { 
    isOwner, 
    unplayedMatches, 
    playMatches, 
    ownerWithdraw,
    isWritePending,
    isConfirming 
  } = useVirtualFootballContract();

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedMatches, setSelectedMatches] = useState<number[]>([]);

  // Get contract balance
  const { data: contractBalance } = useBalance({
    address: CONTRACT_ADDRESS,
  });

  if (!isOwner()) {
    return null;
  }

  const handlePlayMatches = async () => {
    if (selectedMatches.length === 0) return;
    try {
      await playMatches(selectedMatches);
      setSelectedMatches([]);
    } catch (error) {
      console.error('Failed to play matches:', error);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount) return;
    try {
      await ownerWithdraw(withdrawAmount);
      setWithdrawAmount('');
    } catch (error) {
      console.error('Failed to withdraw:', error);
    }
  };

  const toggleMatchSelection = (matchId: number) => {
    setSelectedMatches(prev => 
      prev.includes(matchId) 
        ? prev.filter(id => id !== matchId)
        : [...prev, matchId]
    );
  };

  const selectAllMatches = () => {
    setSelectedMatches(unplayedMatches.map(m => m.id));
  };

  const clearSelection = () => {
    setSelectedMatches([]);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-amber-400">
            <Crown className="w-5 h-5 mr-2" />
            Owner Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contract Balance */}
          <div className="bg-slate-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400">Contract Balance:</span>
              <span className="text-2xl font-bold text-emerald-400">
                {contractBalance ? formatEther(contractBalance.value) : '0'} ETH
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Amount to withdraw"
                className="bg-slate-700/50 border-slate-600 text-white"
                disabled={isWritePending || isConfirming}
              />
              <Button
                onClick={handleWithdraw}
                disabled={!withdrawAmount || isWritePending || isConfirming}
                className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
              >
                {isWritePending || isConfirming ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Withdraw
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Match Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Unplayed Matches</h3>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {unplayedMatches.length} Available
              </Badge>
            </div>

            {unplayedMatches.length === 0 ? (
              <div className="bg-slate-800/30 rounded-lg p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-400">No unplayed matches available</p>
                <p className="text-slate-500 text-sm">Create new matches first</p>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2 mb-4">
                  <Button
                    onClick={selectAllMatches}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
                  >
                    Select All
                  </Button>
                  <Button
                    onClick={clearSelection}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handlePlayMatches}
                    disabled={selectedMatches.length === 0 || isWritePending || isConfirming}
                    className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
                  >
                    {isWritePending || isConfirming ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Playing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Play Selected ({selectedMatches.length})
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {unplayedMatches.map((match) => (
                    <div
                      key={match.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedMatches.includes(match.id)
                          ? 'bg-emerald-500/20 border-emerald-500/50'
                          : 'bg-slate-800/30 border-slate-700 hover:bg-slate-700/50'
                      }`}
                      onClick={() => toggleMatchSelection(match.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded border-2 ${
                            selectedMatches.includes(match.id)
                              ? 'bg-emerald-500 border-emerald-500'
                              : 'border-slate-500'
                          }`} />
                          <span className="text-white font-medium">
                            {match.teamA} vs {match.teamB}
                          </span>
                        </div>
                        <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                          ID: {match.id}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}