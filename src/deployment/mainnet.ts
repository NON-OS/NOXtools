import type { Deployment } from "./types.js";

export const MAINNET_DEPLOYMENT: Deployment = {
  chainId: 1,
  label: "mainnet",
  stakingProxy: "0xa94d6009790Ba13597A1E1b7cF4e1531eA513613",
  stakingImpl: "0x415790B1f0aecd18B24D53BEaa25597573375B63",
  namespaceRegistry: "0xD554ae30A0D20CB988c40d6C3b3d907740B9FD5C",
  accessRegistry: "0x31140F839E2BB03C903ca894A87DF40c7333d38b",
  token: "0x0a26c80Be4E060e688d7C23aDdB92cBb5D2C9eCA",
  safe: "0x3a52eA60F61036aFBBeC25F46A64485aC4477CCC",
};
