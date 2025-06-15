'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import { Match, Bet, Result } from '@/types/contract';

export function useVirtualFootballContract() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  // Read functions
  const { data: matchCounter } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'matchCounter',
  });

  const { data: betCounter } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'betCounter',
  });

  const { data: lastGeneratedTime } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'lastGeneratedTime',
  });

  const { data: owner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'owner',
  });

  const { data: latestMatches, refetch: refetchMatches } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getLatestMatches',
    args: [20n], // Get latest 20 matches
  });

  // Write functions
  const createMatches = async () => {
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'createMatches',
      });
    } catch (error) {
      console.error('Error creating matches:', error);
      throw error;
    }
  };

  const playMatches = async (matchIds: number[]) => {
    try {
      const matchIdsBigInt = matchIds.map(id => BigInt(id));
      
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'playMatches',
        args: [matchIdsBigInt],
      });
    } catch (error) {
      console.error('Error playing matches:', error);
      throw error;
    }
  };

  const placeBet = async (matchIds: number[], predictions: Result[], amount: string) => {
    try {
      const matchIdsBigInt = matchIds.map(id => BigInt(id));
      const predictionNumbers = predictions.map(p => Number(p));
      
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'placeBet',
        args: [matchIdsBigInt, predictionNumbers],
        value: parseEther(amount),
      });
    } catch (error) {
      console.error('Error placing bet:', error);
      throw error;
    }
  };

  const claimBet = async (betId: number) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'claimBet',
        args: [BigInt(betId)],
      });
    } catch (error) {
      console.error('Error claiming bet:', error);
      throw error;
    }
  };

  const ownerWithdraw = async (amount: string) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'ownerWithdraw',
        args: [parseEther(amount)],
      });
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      throw error;
    }
  };

  // Helper functions
  const getTimeUntilNextGeneration = () => {
    if (!lastGeneratedTime) return 0;
    const now = Math.floor(Date.now() / 1000);
    const nextTime = Number(lastGeneratedTime) + (5 * 60); // 5 minutes
    return Math.max(0, nextTime - now);
  };

  const canGenerateMatches = () => {
    return getTimeUntilNextGeneration() === 0;
  };

  const isOwner = () => {
    return address && owner && address.toLowerCase() === owner.toLowerCase();
  };

  // Transform contract data to frontend format
  const transformMatches = (contractMatches: any[]): Match[] => {
    if (!contractMatches) return [];
    
    return contractMatches.map((match: any) => ({
      id: Number(match.id),
      league: Number(match.league),
      teamA: match.teamA,
      teamB: match.teamB,
      goalsA: Number(match.goalsA),
      goalsB: Number(match.goalsB),
      result: Number(match.result),
      startTime: Number(match.startTime) * 1000, // Convert to milliseconds
      played: match.played,
    }));
  };

  // Separate matches into played and unplayed
  const allMatches = transformMatches(latestMatches || []);
  const playedMatches = allMatches.filter(match => match.played);
  const unplayedMatches = allMatches.filter(match => !match.played);

  return {
    // Data
    matchCounter: matchCounter ? Number(matchCounter) : 0,
    betCounter: betCounter ? Number(betCounter) : 0,
    matches: allMatches,
    playedMatches,
    unplayedMatches,
    owner: owner as string,
    
    // Functions
    createMatches,
    playMatches,
    placeBet,
    claimBet,
    ownerWithdraw,
    refetchMatches,
    
    // State
    isWritePending,
    isConfirming,
    isConfirmed,
    hash,
    
    // Helpers
    getTimeUntilNextGeneration,
    canGenerateMatches,
    isOwner,
  };
}

// Hook to read a specific bet
export function useBet(betId: number) {
  const { data: bet } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'bets',
    args: [BigInt(betId)],
  });

  return bet ? {
    bettor: bet.bettor,
    amount: formatEther(bet.amount),
    claimed: bet.claimed,
  } : null;
}

// Hook to read a specific match
export function useMatch(matchId: number) {
  const { data: match } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'matches',
    args: [BigInt(matchId)],
  });

  return match ? {
    id: Number(match.id),
    league: Number(match.league),
    teamA: match.teamA,
    teamB: match.teamB,
    goalsA: Number(match.goalsA),
    goalsB: Number(match.goalsB),
    result: Number(match.result),
    startTime: Number(match.startTime) * 1000,
    played: match.played,
  } : null;
}