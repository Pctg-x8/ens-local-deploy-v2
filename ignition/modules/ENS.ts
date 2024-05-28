import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import {
  keccak256,
  namehash,
  stringToBytes,
  zeroAddress,
  zeroHash,
} from "viem";

const BaseModule = buildModule("Base", (m) => {
  const deployer = m.getAccount(0);

  const registry = m.contract("ENSRegistry", [], { from: deployer });
  const root = m.contract("Root", [registry], { from: deployer });
  m.call(root, "setController", [deployer, true], { from: deployer });
  m.call(registry, "setOwner", [zeroHash, root], { from: deployer });

  const reverseRegistrar = m.contract("ReverseRegistrar", [registry], {
    from: deployer,
  });
  const rootSetReverseNodeOwner = m.call(
    root,
    "setSubnodeOwner",
    [keccak256(stringToBytes("reverse"), "hex"), deployer],
    { from: deployer }
  );
  m.call(
    registry,
    "setSubnodeOwner",
    [
      namehash("reverse"),
      keccak256(stringToBytes("addr"), "hex"),
      reverseRegistrar,
    ],
    { from: deployer, after: [rootSetReverseNodeOwner] }
  );

  return { registry, root, reverseRegistrar };
});

const RegistrarModule = buildModule("Registrar", (m) => {
  const deployer = m.getAccount(0);
  const { registry, root } = m.useModule(BaseModule);

  const registrar = m.contract("FIFSRegistrar", [registry, namehash("io")], {
    from: deployer,
  });
  m.call(
    root,
    "setSubnodeOwner",
    [keccak256(stringToBytes("io"), "hex"), registrar],
    { from: deployer }
  );

  return { registrar };
});

const ResolverModule = buildModule("Resolver", (m) => {
  const deployer = m.getAccount(0);
  const { registry, reverseRegistrar } = m.useModule(BaseModule);

  const resolver = m.contract(
    "PublicResolver",
    [registry, zeroAddress, zeroAddress, reverseRegistrar],
    { from: deployer }
  );

  return { resolver };
});

export default buildModule("Root", (m) => {
  const { registry, root } = m.useModule(BaseModule);
  const { registrar } = m.useModule(RegistrarModule);
  const { resolver } = m.useModule(ResolverModule);

  return { registry, root, registrar, resolver };
});
