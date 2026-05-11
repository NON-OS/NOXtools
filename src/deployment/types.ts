export interface Deployment {
  chainId: number;
  label: string;
  stakingProxy: `0x${string}`;
  stakingImpl: `0x${string}`;
  namespaceRegistry: `0x${string}`;
  accessRegistry: `0x${string}`;
  token: `0x${string}`;
  safe: `0x${string}`;
}
