'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVirtualFootballContract } from '@/hooks/useContract';
import { useAccount } from 'wagmi';
import { Activity, Database, Clock, AlertTriangle } from 'lucide-react';
import { CONTRACT_ADDRESS } from '@/lib/contract';

export default function ContractStatus() {
  const { isConnected } = useAccount();
  const { 
    matchCounter, 
    betCounter, 
    getTimeUntilNextGeneration,
    canGenerateMatches 
  } = useVirtualFootballContract();

  const timeUntilNext = getTimeUntilNextGeneration();
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isContractDeployed = CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000";

  if (!isContractDeployed) {
    return (
      <Card className="bg-red-500/10 border-red-500/20 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-red-400 font-medium">Contract Not Deployed</p>
              <p className="text-red-300 text-sm">Please update CONTRACT_ADDRESS in lib/contract.ts</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card className="bg-amber-500/10 border-amber-500/20 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-amber-400 font-medium">Wallet Not Connected</p>
              <p className="text-amber-300 text-sm">Connect your wallet to interact with the contract</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{matchCounter}</p>
              <p className="text-slate-400 text-sm">Total Matches</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{betCounter}</p>
              <p className="text-slate-400 text-sm">Total Bets</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {canGenerateMatches ? 'Ready' : formatTime(timeUntilNext)}
              </p>
              <p className="text-slate-400 text-sm">Next Generation</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}