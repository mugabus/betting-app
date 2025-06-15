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

      const laLigaTeams = await contract.leagueTeams(0, 0);
      expect(laLigaTeams).to.be.a("string");
      expect(laLigaTeams).to.not.be.empty;

      const premierLeagueTeams = await contract.leagueTeams(1, 0);
      expect(premierLeagueTeams).to.be.a("string");
      expect(premierLeagueTeams).to.not.be.empty;

      const serieATeams = await contract.leagueTeams(2, 0);
      expect(serieATeams).to.be.a("string");
      expect(serieATeams).to.not.be.empty;
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

      await contract.createMatches();

      const matchCounter = await contract.matchCounter();
      expect(matchCounter).to.be.gt(0);

      const createdMatchIds = [];
      for (let i = 1; i <= Number(matchCounter); i++) {
        createdMatchIds.push(i);
      }

      await contract.playMatches(createdMatchIds);

      const match1 = await contract.matches(1);
      expect(match1.played).to.equal(true);
      expect(match1.teamA).to.not.equal("");
      expect(match1.teamB).to.not.equal("");
      expect(match1.result).to.not.equal(0);
    });
  });

  describe("Betting", function () {
    it("Should place and store a bet", async function () {
      const { contract, user } = await loadFixture(deployFixture);
      await time.increase(5 * 60);
      await contract.createMatches();

      const matchIds = [1, 2, 3];
      const predictions = [1, 2, 3];

      await contract.connect(user).placeBet(matchIds, predictions, { value: ethers.parseEther("1.0") });

      const betCounter = await contract.betCounter();
      expect(betCounter).to.equal(1);

      // When calling a public mapping of a struct, ethers.js returns an array-like object
      // where each element corresponds to a member of the struct in order.
      // We can access them by index or by property name (if supported by ethers.js version).
      // For arrays within structs, the getter typically only returns the first element or a default value.
      // To properly check arrays, you'd need a dedicated getter function in the Solidity contract.
      // For now, we'll focus on the primitive types returned.
      const betData = await contract.bets(1);
      expect(betData.bettor).to.equal(user.address);
      expect(betData.amount).to.equal(ethers.parseEther("1.0"));
      expect(betData.claimed).to.be.false;

      // Note: `betData.matchIds` and `betData.predictions` will likely be `0` or `undefined`
      // when accessed this way because the public getter for struct members doesn't expose dynamic arrays fully.
      // If you need to test the arrays, add view functions to your contract like:
      // function getBetMatchIds(uint256 betId) public view returns (uint256[] memory) { return bets[betId].matchIds; }
      // function getBetPredictions(uint256 betId) public view returns (Result[] memory) { return bets[betId].betPredictions; }
    });

    it("Should claim a correct bet with payout", async function () {
      const { contract, owner, user } = await loadFixture(deployFixture); // Include owner
      await time.increase(5 * 60);
      await contract.createMatches();

      const matchCounter = await contract.matchCounter();
      const createdMatchIds = [];
      for (let i = 1; i <= Number(matchCounter); i++) {
        createdMatchIds.push(i);
      }
      await contract.playMatches(createdMatchIds);

      const match1 = await contract.matches(1);
      const match2 = await contract.matches(2);
      const match3 = await contract.matches(3);

      const matchIds = [1, 2, 3];
      const predictions = [match1.result, match2.result, match3.result];

      const betAmount = ethers.parseEther("1.0");

      // Fund the contract with enough Ether for the payout
      await owner.sendTransaction({ to: await contract.getAddress(), value: betAmount * ethers.toBigInt(2) });

      await contract.connect(user).placeBet(matchIds, predictions, { value: betAmount });

      await expect(() => contract.connect(user).claimBet(1)).to.changeEtherBalance(user, betAmount * ethers.toBigInt(2));

      const betDataAfter = await contract.bets(1);
      expect(betDataAfter.claimed).to.equal(true);
    });

    it("Should not payout on an incorrect bet and mark as claimed", async function () {
      const { contract, user } = await loadFixture(deployFixture);
      await time.increase(5 * 60);
      await contract.createMatches();

      const matchCounter = await contract.matchCounter();
      const createdMatchIds = [];
      for (let i = 1; i <= Number(matchCounter); i++) {
        createdMatchIds.push(i);
      }
      await contract.playMatches(createdMatchIds);

      const match1 = await contract.matches(1);
      let incorrectPrediction;
      if (match1.result === 1) {
        incorrectPrediction = 3;
      } else if (match1.result === 2) {
        incorrectPrediction = 1;
      } else {
        incorrectPrediction = 2;
      }

      const matchIds = [1];
      const predictions = [incorrectPrediction];

      const betAmount = ethers.parseEther("1.0");
      await contract.connect(user).placeBet(matchIds, predictions, { value: betAmount });

      const initialUserBalance = await ethers.provider.getBalance(user.address);
      const tx = await contract.connect(user).claimBet(1);
      const receipt = await tx.wait();
      const gasUsed = receipt?.gasUsed ?? ethers.toBigInt(0);
      const gasPrice = receipt?.gasPrice ?? ethers.toBigInt(0);
      const gasCost = gasUsed * gasPrice;

      const finalUserBalance = await ethers.provider.getBalance(user.address);

      expect(finalUserBalance).to.equal(initialUserBalance - gasCost);

      const betDataAfter = await contract.bets(1);
      expect(betDataAfter.claimed).to.equal(true);
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to withdraw funds", async function () {
      const { contract, owner, user } = await loadFixture(deployFixture);
      await time.increase(5 * 60);
      await contract.createMatches();
      const matchCounter = await contract.matchCounter();
      const createdMatchIds = [];
      for (let i = 1; i <= Number(matchCounter); i++) {
        createdMatchIds.push(i);
      }
      await contract.playMatches(createdMatchIds);

      const match1 = await contract.matches(1);
      let incorrectPrediction;
      if (match1.result === 1) { incorrectPrediction = 3; }
      else if (match1.result === 2) { incorrectPrediction = 1; }
      else { incorrectPrediction = 2; }

      const betAmount = ethers.parseEther("1.0");
      await contract.connect(user).placeBet([1], [incorrectPrediction], { value: betAmount });
      await contract.connect(user).claimBet(1);

      const contractAddress = await contract.getAddress(); // Get contract address once
      const contractBalanceBeforeWithdraw = await ethers.provider.getBalance(contractAddress);
      expect(contractBalanceBeforeWithdraw).to.be.gt(0);

      const withdrawAmount = ethers.parseEther("0.5");
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
      const tx = await contract.connect(owner).ownerWithdraw(withdrawAmount);
      const receipt = await tx.wait();
      const gasUsed = receipt?.gasUsed ?? ethers.toBigInt(0);
      const gasPrice = receipt?.gasPrice ?? ethers.toBigInt(0);
      const gasCost = gasUsed * gasPrice;
      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);

      expect(finalOwnerBalance).to.equal(initialOwnerBalance + withdrawAmount - gasCost);

      const contractBalanceAfterWithdraw = await ethers.provider.getBalance(contractAddress);
      expect(contractBalanceAfterWithdraw).to.equal(contractBalanceBeforeWithdraw - withdrawAmount);
    });

    it("Should revert if non-owner tries to withdraw funds", async function () {
      const { contract, user } = await loadFixture(deployFixture);
      await expect(contract.connect(user).ownerWithdraw(ethers.parseEther("1.0"))).to.be.revertedWith("Only owner");
    });
  });

  describe("View Functions", function () {
    it("Should return latest matches", async function () {
      const { contract } = await loadFixture(deployFixture);
      await time.increase(5 * 60);
      await contract.createMatches();

      const latestMatches = await contract.getLatestMatches(ethers.toBigInt(5));

      const matchCounter = await contract.matchCounter();

      expect(latestMatches.length).to.be.at.most(5);
      if (Number(matchCounter) > 0) {
        expect(latestMatches[0].id).to.be.gte(matchCounter > ethers.toBigInt(5) ? matchCounter - ethers.toBigInt(5) + ethers.toBigInt(1) : ethers.toBigInt(1));
      }
      if (latestMatches.length > 0) {
        expect(latestMatches[0].teamA).to.not.be.empty;
      }
    });
  });
});