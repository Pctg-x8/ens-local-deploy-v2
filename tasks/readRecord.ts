import { task } from "hardhat/config";
import DeployedAddresses from "../ignition/deployments/chain-31337/deployed_addresses.json";
import { Address, namehash } from "viem";

task("readRecord")
  .addParam<string>("name")
  .setAction(async ({ name }, hre) => {
    const registry = await hre.viem.getContractAt(
      "ENSRegistry",
      DeployedAddresses["Base#ENSRegistry"] as Address
    );

    const resolver = await registry.read.resolver([namehash(name)]);
    const owner = await registry.read.owner([namehash(name)]);
    console.log("resolver", resolver);
    console.log("owner", owner);
  });
