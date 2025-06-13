export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with your deployed contract address

export const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "payout",
        "type": "uint256"
      }
    ],
    "name": "BetClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "bettor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256[]",
        "name": "matchIds",
        "type": "uint256[]"
      }
    ],
    "name": "BetPlaced",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "teamA",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "teamB",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "enum VirtualAutoFootball.League",
        "name": "league",
        "type": "uint8"
      }
    ],
    "name": "MatchCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "goalsA",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "goalsB",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "enum VirtualAutoFootball.Result",
        "name": "result",
        "type": "uint8"
      }
    ],
    "name": "MatchPlayed",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "betCounter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "bets",
    "outputs": [
      {
        "internalType": "address",
        "name": "bettor",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "claimed",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "betId",
        "type": "uint256"
      }
    ],
    "name": "claimBet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "createAndSimulateMatches",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "count",
        "type": "uint256"
      }
    ],
    "name": "getLatestMatches",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "enum VirtualAutoFootball.League",
            "name": "league",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "teamA",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "teamB",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "goalsA",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "goalsB",
            "type": "uint8"
          },
          {
            "internalType": "enum VirtualAutoFootball.Result",
            "name": "result",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "startTime",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "played",
            "type": "bool"
          }
        ],
        "internalType": "struct VirtualAutoFootball.Match[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lastGeneratedTime",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "leagueTeams",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "matchCounter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "matches",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "enum VirtualAutoFootball.League",
        "name": "league",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "teamA",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "teamB",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "goalsA",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "goalsB",
        "type": "uint8"
      },
      {
        "internalType": "enum VirtualAutoFootball.Result",
        "name": "result",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "startTime",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "played",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256[]",
        "name": "matchIds",
        "type": "uint256[]"
      },
      {
        "internalType": "enum VirtualAutoFootball.Result[]",
        "name": "predictions",
        "type": "uint8[]"
      }
    ],
    "name": "placeBet",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
] as const;