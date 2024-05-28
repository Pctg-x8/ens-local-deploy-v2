import { task } from "hardhat/config";
import DeployedAddresses from "../ignition/deployments/chain-31337/deployed_addresses.json";
import { Address, namehash } from "viem";

task("set-addr")
  .addParam("name")
  .addParam("addr")
  .setAction(async ({ name, addr }, hre) => {
    const registry = await hre.viem.getContractAt(
      "ENSRegistry",
      DeployedAddresses["Base#ENSRegistry"] as Address
    );
    const resolverAddr = await registry.read.resolver([namehash(name)]);
    const resolver = await hre.viem.getContractAt("AddrResolver", resolverAddr);

    await resolver.write.setAddr([namehash(name), 60n, addr]);
  });

task("addr")
  .addParam("name")
  .setAction(async ({ name }, hre) => {
    const registry = await hre.viem.getContractAt(
      "ENSRegistry",
      DeployedAddresses["Base#ENSRegistry"] as Address
    );
    const resolverAddr = await registry.read.resolver([namehash(name)]);
    const resolver = await hre.viem.getContractAt("AddrResolver", resolverAddr);

    const addr = await resolver.read.addr([namehash(name)]);
    console.log(addr);
  });
