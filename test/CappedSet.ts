import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { CappedSet, CappedSet__factory } from "../typechain-types";
import { MaxUint256 } from "ethers";
  
describe("CappedSet", async () => {
  let CappedSet: CappedSet__factory;
  let cappedSet: CappedSet;
  let maxCap: number = 100;
  const randVals = Array.from({length: maxCap}, () => Math.floor((Math.random() * maxCap) + 10));
  const randAddrs = await Array.from({length: maxCap}, () => (ethers.Wallet.createRandom()).address);

  before("before all", async () => {
    CappedSet = await ethers.getContractFactory("CappedSet");
    cappedSet = await CappedSet.deploy(maxCap);
  })

  describe("initialization", () => {
    context("should success", () => {
      it("numElements should return correct value", async() => {
        const numElements = await cappedSet.numElements();
        expect(numElements).to.equal(maxCap)
      })
    })

    context("should revert", () => {
      it("initialization should revert if numElements = 0", async() => {
        await expect(CappedSet.deploy(0)).to.be.revertedWith("_numElements must be > 0");
      })
    })
  });

  describe("capped set core function", () => {
    describe("insert", () => {
      it("should insert succesfully", async() => {
        for(let i = 0; i < maxCap; i++) {  
          await cappedSet.insert(randAddrs[i], randVals[i]);
          const element = await cappedSet.elements(i);
          expect(element[0]).to.equal(randAddrs[i]);
          expect(element[1]).to.equal(randVals[i]);
        }


        await expect(cappedSet.elements(maxCap)).to.be.revertedWithoutReason();
      })

      it("should remove the lowest value insert after reached out the max cap", async() => {
        let lowestElement = await cappedSet.getLowestElement();
        const previousLowestValue = lowestElement[1];
        const previousLowestAddress = lowestElement[0];

        /** will have new lowest value here */
        const newLowestValue = previousLowestValue - BigInt(1);
        const newLowestAddress = (ethers.Wallet.createRandom()).address;

        expect(previousLowestAddress).to.not.equal(newLowestAddress);
        expect(previousLowestValue).to.not.equal(newLowestValue);

        /** insert the new value after max cap has been reached out */
        await cappedSet.insert(newLowestAddress, newLowestValue);

        /** lowest value should be updated with the new one */
        lowestElement = await cappedSet.getLowestElement();
        expect(lowestElement[0]).to.equal(newLowestAddress);
        expect(lowestElement[1]).to.equal(newLowestValue);
      })
    })
    
    describe("update", () => {
      context("succesfull update", () => {
        it("should update successfully", async() => {
          /** use index maxCap / 2 of randAddrs as sample to update, but can improved but using randomize number, or make the iteration to support fuzzy testing */
          const addrTarget = randAddrs[maxCap / 2];
          let elementVal = await cappedSet.getValue(addrTarget);
    
          const newVal = elementVal + BigInt(100);
          await cappedSet.update(addrTarget, newVal);
    
          elementVal = await cappedSet.getValue(addrTarget);
          expect(elementVal).to.equal(newVal);
        })
      })
    
      context("reverted update", () => {
        it("update should revert if addr does not exist in the set", async() => {
          const addr = (ethers.Wallet.createRandom()).address;
          await expect(cappedSet.update(addr, BigInt(100))).to.be.revertedWith("element not found");
        })
      })
    })

    describe("getValue", () => {
      it("getValue should revert if address does not exist in the set", async() => {
        const addr = (ethers.Wallet.createRandom()).address;
        await expect(cappedSet.getValue(addr)).to.be.revertedWith("element not found");
      })
    })

    describe("remove", () => {
      context("successfull remove", () => {
        it("should remove successfully", async() => {
          /** use index maxCap / 4 of randAddrs as sample to remove, but can improved but using randomize number, or make the iteration to support fuzzy testing */
          const randomTargetIndex = maxCap / 4;
          const addrTarget = randAddrs[randomTargetIndex];
          const initialIndexOfTarget = await cappedSet.findElementIndexByAddr(addrTarget);
          let elementOfTarget = await cappedSet.elements(initialIndexOfTarget);
          let lastElement = await cappedSet.elements(maxCap - 1);

          const lastAddress = lastElement[0];
          const lastVal = lastElement[1];

          await cappedSet.remove(addrTarget);

          /** index of removed should be updated by the value of latest index */
          elementOfTarget = await cappedSet.elements(initialIndexOfTarget);
          const addressOfTarget = elementOfTarget[0];
          const valOfTarget = elementOfTarget[1];

          expect(addressOfTarget).to.equal(lastAddress);
          expect(valOfTarget).to.equal(lastVal);

          const [latestIndexOfTarget, indexOfLastElement] = await Promise.all([
            cappedSet.findElementIndexByAddr(addrTarget),
            cappedSet.findElementIndexByAddr(lastAddress)
          ])

          /** index of target should be returning max uint256 val since it's been removed */
          expect(latestIndexOfTarget).to.equal(MaxUint256)

          /** now the index of the previous last element should be the same initial index of target */
          expect(indexOfLastElement).to.equal(randomTargetIndex);

          /** maxcap - 1 should revert since it's been removed */
          await expect(cappedSet.elements(maxCap - 1)).to.be.revertedWithoutReason();
        })
      })

      context("reverted remove", () => {
        it("remove should revert if address does not exist in the set", async() => {
          const addr = (ethers.Wallet.createRandom()).address;
          await expect(cappedSet.remove(addr)).to.be.revertedWith("element not found");
        })
      })
    })
  })
});
  