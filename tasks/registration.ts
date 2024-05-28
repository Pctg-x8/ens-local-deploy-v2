import { task } from "hardhat/config";
import DeployedAddresses from "../ignition/deployments/chain-31337/deployed_addresses.json";
import {
  Address,
  isAddressEqual,
  labelhash,
  namehash,
  zeroAddress,
} from "viem";
import { HardhatRuntimeEnvironment } from "hardhat/types";

async function isAcquired(
  hre: HardhatRuntimeEnvironment,
  name: string
): Promise<boolean> {
  const registry = await hre.viem.getContractAt(
    "ENSRegistry",
    DeployedAddresses["Base#ENSRegistry"] as Address
  );
  const owner = await registry.read.owner([namehash(name)]);

  return !isAddressEqual(owner, zeroAddress);
}

async function register2ld(
  hre: HardhatRuntimeEnvironment,
  label: string,
  tld: string
): Promise<void> {
  if (tld !== "io") {
    throw new Error("tld not supported");
  }

  const tempOwner = (await hre.viem.getWalletClients())[0];
  const registrar = await hre.viem.getContractAt(
    "FIFSRegistrar",
    DeployedAddresses["Registrar#FIFSRegistrar"] as Address
  );
  const registry = await hre.viem.getContractAt(
    "ENSRegistry",
    DeployedAddresses["Base#ENSRegistry"] as Address
  );
  const defaultResolver = await hre.viem.getContractAt(
    "PublicResolver",
    DeployedAddresses["Resolver#PublicResolver"] as Address
  );

  await registrar.write.register(
    [labelhash(label), tempOwner.account.address],
    { account: tempOwner.account }
  );
  await registry.write.setRecord([
    namehash(`${label}.${tld}`),
    tempOwner.account.address,
    defaultResolver.address,
    0n,
  ]);
}

async function registerSubname(
  hre: HardhatRuntimeEnvironment,
  label: string,
  base: string
): Promise<void> {
  const tempOwner = (await hre.viem.getWalletClients())[0];
  const registry = await hre.viem.getContractAt(
    "ENSRegistry",
    DeployedAddresses["Base#ENSRegistry"] as Address
  );
  const defaultResolver = await hre.viem.getContractAt(
    "PublicResolver",
    DeployedAddresses["Resolver#PublicResolver"] as Address
  );

  await registry.write.setSubnodeRecord([
    namehash(base),
    labelhash(label),
    tempOwner.account.address,
    defaultResolver.address,
    0n,
  ]);
}

task("register2ld")
  .addParam("name")
  .setAction(async ({ name }, hre) => {
    const [label, tld] = name.split(".");

    await register2ld(hre, label, tld);
  });

task("register-subname")
  .addParam("name")
  .setAction(async ({ name }, hre) => {
    const splitted = name.split(".");
    const label = splitted.shift();
    const base = splitted.join(".");

    await registerSubname(hre, label, base);
  });

task("register-recursive")
  .addParam("name")
  .setAction(async ({ name }, hre) => {
    async function rec(name: string) {
      const splitted = name.split(".");
      switch (splitted.length) {
        case 0:
        case 1:
          throw new Error("unreachable");
        case 2:
          // [label, tld]
          if (!(await isAcquired(hre, name))) {
            console.log(`register ${name}`);
            await register2ld(hre, splitted[0], splitted[1]);
          }
          break;
        default: {
          // [label, base]
          const base = splitted.slice(1).join(".");
          await rec(base);
          if (!(await isAcquired(hre, name))) {
            console.log(`register ${name}`);
            await registerSubname(hre, splitted[0], base);
          }
          break;
        }
      }
    }

    await rec(name);
  });
