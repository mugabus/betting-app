// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";



const VirtualAutoFootballModule = buildModule("VirtualAutoFootballModule", (m) => {


  const virtualAutoFootball= m.contract("VirtualAutoFootball", [], {
    
  });

  return { virtualAutoFootball };
});

export default VirtualAutoFootballModule;
