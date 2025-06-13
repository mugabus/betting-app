// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract VirtualAutoFootball {
    enum League { LaLiga, PremierLeague, SerieA }
    enum Result { NotSet, TeamAWin, TeamBWin, Draw }

    struct Match {
        uint256 id;
        League league;
        string teamA;
        string teamB;
        uint8 goalsA;
        uint8 goalsB;
        Result result;
        uint256 startTime;
        bool played;
    }

    struct Bet {
        uint256[] matchIds;
        Result[] predictions;
        address bettor;
        uint256 amount;
        bool claimed;
    }

    uint256 public matchCounter;
    uint256 public betCounter;
    uint256 public lastGeneratedTime;

    mapping(uint256 => Match) public matches;
    mapping(uint256 => Bet) public bets;

    // League -> List of teams
    string[][3] public leagueTeams;

    event MatchCreated(uint256 id, string teamA, string teamB, League league);
    event MatchPlayed(uint256 id, uint8 goalsA, uint8 goalsB, Result result);
    event BetPlaced(uint256 id, address bettor, uint256[] matchIds);
    event BetClaimed(uint256 id, uint256 payout);

    constructor() {
        // LaLiga Teams
        leagueTeams[uint(League.LaLiga)] = [
            "Barcelona", "Real Madrid", "Atletico Madrid", "Sevilla", "Valencia",
            "Villarreal", "Real Betis", "Athletic Club", "Real Sociedad", "Celta Vigo"
        ];

        // Premier League Teams
        leagueTeams[uint(League.PremierLeague)] = [
            "Arsenal", "Manchester City", "Liverpool", "Chelsea", "Manchester United",
            "Tottenham", "Newcastle", "West Ham", "Aston Villa", "Brighton"
        ];

        // Serie A Teams
        leagueTeams[uint(League.SerieA)] = [
            "Juventus", "AC Milan", "Inter Milan", "Napoli", "Roma",
            "Lazio", "Atalanta", "Fiorentina", "Torino", "Sassuolo"
        ];

        lastGeneratedTime = block.timestamp;
    }

    modifier onlyAfterInterval() {
        require(block.timestamp >= lastGeneratedTime + 5 minutes, "Wait 5 minutes");
        _;
    }

    function createAndSimulateMatches() external onlyAfterInterval {
        for (uint l = 0; l < 3; l++) {
            string[] memory teams = leagueTeams[l];

            // Random team selection for match
            uint256 teamAIndex = uint256(keccak256(abi.encodePacked(block.timestamp, l, "A", matchCounter))) % teams.length;
            uint256 teamBIndex = (teamAIndex + 1 + (block.timestamp % (teams.length - 1))) % teams.length;

            // Ensure different teams
            if (teamAIndex == teamBIndex) {
                teamBIndex = (teamBIndex + 1) % teams.length;
            }

            string memory teamA = teams[teamAIndex];
            string memory teamB = teams[teamBIndex];

            uint8 goalsA = uint8(uint256(keccak256(abi.encodePacked(block.timestamp, l, "GA", matchCounter))) % 5);
            uint8 goalsB = uint8(uint256(keccak256(abi.encodePacked(block.timestamp, l, "GB", matchCounter))) % 5);

            Result result;
            if (goalsA > goalsB) result = Result.TeamAWin;
            else if (goalsB > goalsA) result = Result.TeamBWin;
            else result = Result.Draw;

            matchCounter++;
            matches[matchCounter] = Match({
                id: matchCounter,
                league: League(l),
                teamA: teamA,
                teamB: teamB,
                goalsA: goalsA,
                goalsB: goalsB,
                result: result,
                startTime: block.timestamp,
                played: true
            });

            emit MatchCreated(matchCounter, teamA, teamB, League(l));
            emit MatchPlayed(matchCounter, goalsA, goalsB, result);
        }

        lastGeneratedTime = block.timestamp;
    }

    function placeBet(uint256[] memory matchIds, Result[] memory predictions) external payable {
        require(matchIds.length == predictions.length, "Match-prediction count mismatch");
        require(msg.value > 0, "Bet amount must be greater than zero");

        betCounter++;
        bets[betCounter] = Bet({
            matchIds: matchIds,
            predictions: predictions,
            bettor: msg.sender,
            amount: msg.value,
            claimed: false
        });

        emit BetPlaced(betCounter, msg.sender, matchIds);
    }

    function claimBet(uint256 betId) external {
        Bet storage b = bets[betId];
        require(msg.sender == b.bettor, "Not your bet");
        require(!b.claimed, "Already claimed");

        for (uint i = 0; i < b.matchIds.length; i++) {
            Match storage m = matches[b.matchIds[i]];
            require(m.played, "Match not played yet");
            require(m.result == b.predictions[i], "Prediction incorrect");
        }

        b.claimed = true;
        uint256 payout = b.amount * 2; // Fixed payout multiplier (2x)
        payable(msg.sender).transfer(payout);

        emit BetClaimed(betId, payout);
    }

    function getLatestMatches(uint256 count) external view returns (Match[] memory) {
        uint256 start = matchCounter > count ? matchCounter - count + 1 : 1;
        uint256 resultLength = matchCounter - start + 1;
        Match[] memory result = new Match[](resultLength);
        for (uint i = 0; i < resultLength; i++) {
            result[i] = matches[start + i];
        }
        return result;
    }
}
