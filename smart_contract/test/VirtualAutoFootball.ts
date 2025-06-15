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

      // Check if at least one team exists for each league
      // The `leagueTeams` mapping returns a string array, accessing an element like leagueTeams[i][0]
      // requires direct access or a view function that returns the array.
      // Since it's a public mapping of arrays, we can only access individual elements by index in tests.
      // We expect the first element to be a string, which means the array is not empty.
      const laLigaTeams = await contract.leagueTeams(0, 0); // Accessing LaLiga (index 0), first team (index 0)
      expect(laLigaTeams).to.be.a("string");
      expect(laLigaTeams).to.not.be.empty;

      const premierLeagueTeams = await contract.leagueTeams(1, 0); // Premier League (index 1), first team
      expect(premierLeagueTeams).to.be.a("string");
      expect(premierLeagueTeams).to.not.be.empty;

      const serieATeams = await contract.leagueTeams(2, 0); // Serie A (index 2), first team
      expect(serieATeams).to.be.a("string");
      expect(serieATeams).to.not.be.empty;
    });
  });

  describe("Match Creation and Playing", function () {
    it("Should revert if createMatches called before 5 minutes", async function () {
      const { contract } = await loadFixture(deployFixture);
      // The contract has a `lastGeneratedTime` set at deployment.
      // Calling `createMatches` immediately after deployment should revert.
      await expect(contract.createMatches()).to.be.revertedWith("Wait 5 minutes");
    });

    it("Should create matches and then play them after 5 minutes", async function () {
      const { contract } = await loadFixture(deployFixture);

      // Advance time by 5 minutes
      await time.increase(5 * 60);

      // Call createMatches
      await contract.createMatches();

      // Check if matches are created (e.g., matchCounter > 0)
      const matchCounter = await contract.matchCounter();
      expect(matchCounter).to.be.gt(0);

      // Get the IDs of the created matches to pass to playMatches
      const createdMatchIds = [];
      for (let i = 1; i <= matchCounter; i++) {
        createdMatchIds.push(i);
      }

      // Play the created matches
      await contract.playMatches(createdMatchIds);

      // Check if the first match created is played and has team names
      const match1 = await contract.matches(1);
      expect(match1.played).to.equal(true);
      expect(match1.teamA).to.not.equal("");
      expect(match1.teamB).to.not.equal("");
      expect(match1.result).to.not.equal(0); // Result should not be NotSet (0)
    });
  });

  describe("Betting", function () {
    it("Should place and store a bet", async function () {
      const { contract, user } = await loadFixture(deployFixture);
      await time.increase(5 * 60);
      await contract.createMatches(); // First create matches

      // Get match IDs to bet on. Assume at least 3 matches are created.
      const matchIds = [1, 2, 3];
      // Predictions can be any valid Result enum value (0: NotSet, 1: TeamAWin, 2: TeamBWin, 3: Draw)
      const predictions = [1, 2, 3]; // Example: TeamAWin, TeamBWin, Draw

      await contract.connect(user).placeBet(matchIds, predictions, { value: ethers.parseEther("1.0") });

      const bet = await contract.bets(1); // Assuming this is the first bet
      expect(bet.bettor).to.equal(user.address);
      expect(bet.amount).to.equal(ethers.parseEther("1.0"));
      expect(bet.matchIds.length).to.equal(matchIds.length);
      expect(bet.predictions.length).to.equal(predictions.length);
    });

    it("Should claim a correct bet with payout", async function () {
      const { contract, user } = await loadFixture(deployFixture);
      await time.increase(5 * 60);
      await contract.createMatches(); // Create matches

      // Get all created match IDs to play them
      const matchCounter = await contract.matchCounter();
      const createdMatchIds = [];
      for (let i = 1; i <= matchCounter; i++) {
        createdMatchIds.push(i);
      }
      await contract.playMatches(createdMatchIds); // Play all matches

      // Get the results of the played matches to make correct predictions
      const match1 = await contract.matches(1);
      const match2 = await contract.matches(2);
      const match3 = await contract.matches(3);

      const matchIds = [1, 2, 3];
      // Use the actual results of the played matches for a winning bet
      const predictions = [match1.result, match2.result, match3.result];

      // Place the bet
      await contract.connect(user).placeBet(matchIds, predictions, { value: ethers.parseEther("1.0") });

      // Claim the bet and check ether balance change
      const initialUserBalance = await ethers.provider.getBalance(user.address);
      const tx = await contract.connect(user).claimBet(1); // Assuming this is bet ID 1
      const receipt = await tx.wait();
      const gasUsed = receipt?.gasUsed ?? ethers.toBigInt(0);
      const gasPrice = receipt?.gasPrice ?? ethers.toBigInt(0);
      const gasCost = gasUsed * gasPrice;

      const finalUserBalance = await ethers.provider.getBalance(user.address);

      // Expected payout is double the bet amount
      const expectedPayout = ethers.parseEther("2.0");

      // Check the final balance is initial + payout - gas cost
      expect(finalUserBalance).to.equal(initialUserBalance + expectedPayout - gasCost);

      const betAfter = await contract.bets(1);
      expect(betAfter.claimed).to.equal(true);
    });

    it("Should not payout on an incorrect bet and mark as claimed", async function () {
      const { contract, user } = await loadFixture(deployFixture);
      await time.increase(5 * 60);
      await contract.createMatches(); // Create matches

      // Get all created match IDs to play them
      const matchCounter = await contract.matchCounter();
      const createdMatchIds = [];
      for (let i = 1; i <= matchCounter; i++) {
        createdMatchIds.push(i);
      }
      await contract.playMatches(createdMatchIds); // Play all matches

      // Get the results of the played matches
      const match1 = await contract.matches(1);
      // Make at least one prediction incorrect
      const incorrectPrediction = (match1.result === 1) ? 2 : 1; // If TeamAWin, predict TeamBWin, else TeamAWin

      const matchIds = [1];
      const predictions = [incorrectPrediction];

      // Place the bet
      await contract.connect(user).placeBet(matchIds, predictions, { value: ethers.parseEther("1.0") });

      // Claim the bet and expect no ether change (minus gas cost)
      const initialUserBalance = await ethers.provider.getBalance(user.address);
      const tx = await contract.connect(user).claimBet(1);
      const receipt = await tx.wait();
      const gasUsed = receipt?.gasUsed ?? ethers.toBigInt(0);
      const gasPrice = receipt?.gasPrice ?? ethers.toBigInt(0);
      const gasCost = gasUsed * gasPrice;

      const finalUserBalance = await ethers.provider.getBalance(user.address);

      expect(finalUserBalance).to.equal(initialUserBalance - gasCost); // Only gas cost should be deducted

      const betAfter = await contract.bets(1);
      expect(betAfter.claimed).to.equal(true);
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to withdraw funds", async function () {
      const { contract, owner, user } = await loadFixture(deployFixture);
      await time.increase(5 * 60);
      await contract.createMatches();
      const matchCounter = await contract.matchCounter();
      const createdMatchIds = [];
      for (let i = 1; i <= matchCounter; i++) {
        createdMatchIds.push(i);
      }
      await contract.playMatches(createdMatchIds);

      // User places a bet that they will lose, so funds remain in contract
      const match1 = await contract.matches(1);
      const incorrectPrediction = (match1.result === 1) ? 2 : 1;
      await contract.connect(user).placeBet([1], [incorrectPrediction], { value: ethers.parseEther("1.0") });
      await contract.connect(user).claimBet(1); // User claims and loses, contract keeps funds

      // Check contract balance
      const contractBalanceBeforeWithdraw = await ethers.provider.getBalance(await contract.getAddress());
      expect(contractBalanceBeforeWithdraw).to.be.gt(0);

      // Owner withdraws funds
      const withdrawAmount = ethers.parseEther("0.5"); // Withdraw a portion
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
      const tx = await contract.connect(owner).ownerWithdraw(withdrawAmount);
      const receipt = await tx.wait();
      const gasUsed = receipt?.gasUsed ?? ethers.toBigInt(0);
      const gasPrice = receipt?.gasPrice ?? ethers.toBigInt(0);
      const gasCost = gasUsed * gasPrice;
      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);

      expect(finalOwnerBalance).to.equal(initialOwnerBalance + withdrawAmount - gasCost);

      const contractBalanceAfterWithdraw = await ethers.provider.getBalance(await contract.getAddress());
      expect(contractBalanceAfterWithdraw).to.equal(contractBalanceBeforeWithdraw - withdrawAmount);
    });

    it("Should revert if non-owner tries to withdraw funds", async function () {
      const { contract, user } = await loadFixture(deployFixture);
      // Try to call ownerWithdraw from a non-owner address
      await expect(contract.connect(user).ownerWithdraw(ethers.parseEther("1.0"))).to.be.revertedWith("Only owner");
    });
  });

  describe("View Functions", function () {
    it("Should return latest matches", async function () {
      const { contract } = await loadFixture(deployFixture);
      await time.increase(5 * 60);
      await contract.createMatches(); // Create some matches

      const latestMatches = await contract.getLatestMatches(5); // Get up to 5 latest matches
      const matchCounter = await contract.matchCounter();

      expect(latestMatches.length).to.be.at.most(5);
      if (matchCounter > 0) {
        expect(latestMatches[0].id).to.be.gte(matchCounter > 5 ? matchCounter - 5 + 1 : 1);
      }
      // Check if the returned matches have correct structure (e.g., teamA is not empty)
      if (latestMatches.length > 0) {
        expect(latestMatches[0].teamA).to.not.be.empty;
      }
    });
  });
});