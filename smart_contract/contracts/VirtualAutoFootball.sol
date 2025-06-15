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

    address public owner;

    mapping(uint256 => Match) public matches;
    mapping(uint256 => Bet) public bets;

    // League -> List of teams
    string[][3] public leagueTeams;

    event MatchCreated(uint256 id, string teamA, string teamB, League league);
    event MatchPlayed(uint256 id, uint8 goalsA, uint8 goalsB, Result result);
    event BetPlaced(uint256 id, address bettor, uint256[] matchIds);
    event BetClaimed(uint256 id, uint256 payout);
    event OwnerWithdraw(address owner, uint256 amount);

    modifier onlyAfterInterval() {
        require(block.timestamp >= lastGeneratedTime + 5 minutes, "Wait 5 minutes");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;

        // LaLiga
        leagueTeams[uint(League.LaLiga)] = [
            "Barcelona", "Real Madrid", "Atletico Madrid", "Sevilla", "Valencia",
            "Villarreal", "Real Betis", "Athletic Club", "Real Sociedad", "Celta Vigo",
            "Alaves", "Espanyol", "Getafe", "Girona", "Las Palmas",
            "Leganes", "Mallorca", "Osasuna", "Rayo Vallecano", "Real Valladolid"
        ];

        // Premier League
        leagueTeams[uint(League.PremierLeague)] = [
            "Arsenal", "Manchester City", "Liverpool", "Chelsea", "Manchester United",
            "Tottenham", "Newcastle", "West Ham", "Aston Villa", "Brighton",
            "Bournemouth", "Brentford", "Crystal Palace", "Everton", "Fulham",
            "Ipswich Town", "Leicester City", "Nottingham Forest", "Southampton", "Wolverhampton Wanderers"
        ];

        // Serie A
        leagueTeams[uint(League.SerieA)] = [
            "Juventus", "AC Milan", "Inter Milan", "Napoli", "Roma",
            "Lazio", "Atalanta", "Fiorentina", "Torino", "Sassuolo",
            "Bologna", "Cagliari", "Como", "Empoli", "Genoa",
            "Hellas Verona", "Lecce", "Monza", "Parma", "Udinese", "Venezia"
        ];

        lastGeneratedTime = block.timestamp;
    }

    // Create matches with random team pairing (played = false, result = NotSet)
    function createMatches() external onlyAfterInterval {
        for (uint l = 0; l < 3; l++) {
            string[] memory teams = leagueTeams[l];
            uint len = teams.length;
            if (len < 2) continue;

            string[] memory shuffled = new string[](len);
            for (uint i = 0; i < len; i++) {
                shuffled[i] = teams[i];
            }

            // Fisher-Yates shuffle
            for (uint i = len - 1; i > 0; i--) {
                uint j = uint(keccak256(abi.encodePacked(block.timestamp, i, matchCounter))) % (i + 1);
                (shuffled[i], shuffled[j]) = (shuffled[j], shuffled[i]);
            }

            // Pairing teams into matches
            for (uint i = 0; i + 1 < len; i += 2) {
                matchCounter++;
                matches[matchCounter] = Match({
                    id: matchCounter,
                    league: League(l),
                    teamA: shuffled[i],
                    teamB: shuffled[i + 1],
                    goalsA: 0,
                    goalsB: 0,
                    result: Result.NotSet,
                    startTime: block.timestamp,
                    played: false
                });

                emit MatchCreated(matchCounter, shuffled[i], shuffled[i + 1], League(l));
            }
        }

        lastGeneratedTime = block.timestamp;
    }

    // Play matches and generate random results (only for unplayed matches)
    function playMatches(uint256[] calldata matchIds) external {
        for (uint i = 0; i < matchIds.length; i++) {
            Match storage m = matches[matchIds[i]];
            require(!m.played, "Already played");

            m.goalsA = uint8(uint256(keccak256(abi.encodePacked(block.timestamp, i, "GA"))) % 5);
            m.goalsB = uint8(uint256(keccak256(abi.encodePacked(block.timestamp, i, "GB"))) % 5);

            if (m.goalsA > m.goalsB) m.result = Result.TeamAWin;
            else if (m.goalsB > m.goalsA) m.result = Result.TeamBWin;
            else m.result = Result.Draw;

            m.played = true;

            emit MatchPlayed(m.id, m.goalsA, m.goalsB, m.result);
        }
    }

    // User places bet on matches (must send ETH)
    function placeBet(uint256[] calldata matchIds, Result[] calldata predictions) external payable {
        require(matchIds.length == predictions.length, "Match-prediction mismatch");
        require(msg.value > 0, "Bet amount must be > 0");

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

    // User claims payout if all predictions are correct
    function claimBet(uint256 betId) external {
        Bet storage b = bets[betId];
        require(msg.sender == b.bettor, "Not your bet");
        require(!b.claimed, "Already claimed");

        for (uint i = 0; i < b.matchIds.length; i++) {
            Match storage m = matches[b.matchIds[i]];
            require(m.played, "Match not played");
            if (m.result != b.predictions[i]) {
                b.claimed = true; // mark claimed so user can't try again
                emit BetClaimed(betId, 0);
                return; // lost bet, no payout
            }
        }

        b.claimed = true;
        uint256 payout = b.amount * 2;
        payable(b.bettor).transfer(payout);

        emit BetClaimed(betId, payout);
    }

    // Owner can withdraw stuck funds (from lost bets)
    function ownerWithdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner).transfer(amount);
        emit OwnerWithdraw(owner, amount);
    }

    // View latest matches
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
