'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, LogOut, AlertCircle } from 'lucide-react';

export default function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium">{formatAddress(address)}</p>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                    Connected
                  </Badge>
                  {chain && (
                    <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                      {chain.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              onClick={() => disconnect()}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Connect Wallet</h3>
          <p className="text-slate-400 text-sm mb-6">
            Connect your wallet to place bets and claim winnings
          </p>
          
          <div className="space-y-3">
            {connectors.map((connector) => (
              <Button
                key={connector.uid}
                onClick={() => connect({ connector })}
                disabled={isPending}
                className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 disabled:opacity-50"
              >
                {isPending ? 'Connecting...' : `Connect ${connector.name}`}
              </Button>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-amber-400 text-xs text-left">
                Make sure you have MetaMask or another Web3 wallet installed and connected to the correct network.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}