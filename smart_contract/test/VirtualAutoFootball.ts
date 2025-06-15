import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("VirtualAutoFootball", function () {
  async function deployFixture() {
    const [owner, user] = await ethers.getSigners();
    const VirtualAutoFootball = await ethers.getContractFactory("VirtualAutoFootball");
    const contract = await VirtualAutoFootball.deploy();
    await contract.waitForDeployment();

    return { contract, owner, user };
  }

  describe("Deployment", function () {
    it("Should deploy with all leagues populated", async function () {
      const { contract } = await loadFixture(deployFixture);

      for (let i = 0; i < 3; i++) {
        const team = await contract.leagueTeams(i, 0);
        expect(team).to.be.a("string").and.not.to.be.empty;
      }
    });
  });

  describe("Match Creation and Playing", function () {
    it("Should revert if createMatches called before 5 minutes", async function () {
      const { contract } = await loadFixture(deployFixture);
      await expect(contract.createMatches()).to.be.revertedWith("Wait 5 minutes");
    });

    it("Should create matches and then play them after 5 minutes", async function () {
      const { contract } = await loadFixture(deployFixture);

      await time.increase(5 * 60);

      // Create matches
      await contract.createMatches();

      // Check first match created
      const match1 = await contract.matches(1);
      expect(match1.played).to.equal(false);
      expect(match1.teamA).to.not.equal("");
      expect(match1.teamB).to.not.equal("");

      // Collect match IDs to play
      // Let's assume matches 1 to 10 were created (adjust if needed)
      const matchIds = [];
      for (let i = 1; i <= 10; i++) {
        try {
          await contract.matches(i); // just to check if match exists
          matchIds.push(i);
        } catch {
          break;
        }
      }

      // Play matches (simulate results)
      await contract.playMatches(matchIds);

      const playedMatch1 = await contract.matches(1);
      expect(playedMatch1.played).to.equal(true);
      expect(playedMatch1.goalsA).to.be.gte(0);
      expect(playedMatch1.goalsB).to.be.gte(0);
      expect(playedMatch1.result).to.not.equal(0); // NotSet is 0
    });
  });

  describe("Betting", function () {
    it("Should place and store a bet", async function () {
      const { contract, user } = await loadFixture(deployFixture);

      await time.increase(5 * 60);
      await contract.createMatches();

      // Play matches for them to be available for betting
      const matchIds = [];
      const predictions = [];
      for (let i = 1; i <= 10; i++) {
        try {
          const m = await contract.matches(i);
          matchIds.push(m.id);
          predictions.push(0); // Just guess TeamAWin for test
        } catch {
          break;
        }
      }

      await contract.playMatches(matchIds);

      await contract.connect(user).placeBet(matchIds, predictions, { value: ethers.utils.parseEther("1.0") });

      const bet = await contract.bets(1);
      expect(bet.bettor).to.equal(user.address);
      expect(bet.amount).to.equal(ethers.utils.parseEther("1.0"));
    });

    it("Should claim a correct bet with payout", async function () {
      const { contract, user } = await loadFixture(deployFixture);

      await time.increase(5 * 60);
      await contract.createMatches();

      // Get matches and play them
      const matchIds = [];
      const predictions = [];
      for (let i = 1; i <= 10; i++) {
        try {
          const m = await contract.matches(i);
          matchIds.push(m.id);
          // Use actual results as predictions to guarantee a win
          predictions.push(m.result);
        } catch {
          break;
        }
      }

      await contract.playMatches(matchIds);

      // Place bet with exact results
      await contract.connect(user).placeBet(matchIds, predictions, { value: ethers.utils.parseEther("1.0") });

      // Check user balance before claim
      const balanceBefore = await ethers.provider.getBalance(user.address);

      // Claim payout and expect balance increase approx 2 ether (minus gas)
      await expect(() => contract.connect(user).claimBet(1)).to.changeEtherBalance(user, ethers.utils.parseEther("2.0"));

      const betAfter = await contract.bets(1);
      expect(betAfter.claimed).to.equal(true);
    });
  });
});
