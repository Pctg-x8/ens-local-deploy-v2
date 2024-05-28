import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

import "./tasks/readRecord";
import "./tasks/registration";
import "./tasks/addr";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
};

export default config;
