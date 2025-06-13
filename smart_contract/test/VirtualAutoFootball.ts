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
        expect(team).to.be.a("string");
      }
    });
  });

  describe("Match Creation", function () {
    it("Should revert if called before 5 minutes", async function () {
      const { contract } = await loadFixture(deployFixture);
      await expect(contract.createAndSimulateMatches()).to.be.revertedWith("Wait 5 minutes");
    });

    it("Should create and simulate matches after 5 minutes", async function () {
      const { contract } = await loadFixture(deployFixture);

      // Advance time
      await time.increase(5 * 60);

      await contract.createAndSimulateMatches();

      const match1 = await contract.matches(1);
      expect(match1.played).to.equal(true);
      expect(match1.teamA).to.not.equal("");
    });
  });

  describe("Betting", function () {
    it("Should place and store a bet", async function () {
      const { contract, user } = await loadFixture(deployFixture);
      await time.increase(5 * 60);
      await contract.createAndSimulateMatches();

      const matchIds = [1, 2, 3];
      const predictions = [0, 1, 2]; // Enum values: TeamAWin, TeamBWin, Draw

      await contract.connect(user).placeBet(matchIds, predictions, { value: ethers.parseEther("1.0") });

      const bet = await contract.bets(1);
      expect(bet.bettor).to.equal(user.address);
      expect(bet.amount).to.equal(ethers.parseEther("1.0"));
    });

    it("Should claim a correct bet with payout", async function () {
      const { contract, user } = await loadFixture(deployFixture);
      await time.increase(5 * 60);
      await contract.createAndSimulateMatches();

      const match1 = await contract.matches(1);
      const match2 = await contract.matches(2);
      const match3 = await contract.matches(3);

      const matchIds = [1, 2, 3];
      const predictions = [match1.result, match2.result, match3.result];

      await contract.connect(user).placeBet(matchIds, predictions, { value: ethers.parseEther("1.0") });

      const betBefore = await contract.bets(1);
      await expect(contract.connect(user).claimBet(1)).to.changeEtherBalance(user, ethers.parseEther("2.0"));

      const betAfter = await contract.bets(1);
      expect(betAfter.claimed).to.equal(true);
    });
  });
});
