# Nym / SOCKS5 anonymity

The SDK and CLI only ever make one kind of outbound call: a JSON-RPC POST to a URL you pass in. Both can route that call through any SOCKS5 endpoint - a local Nym mixnet client, Tor SOCKS5, or an internal hop.

## CLI

```bash
NOX_SOCKS5_PROXY=socks5h://127.0.0.1:1080 \
  noxctl stake status --rpc <url> --staking <addr>
```

That's it. Every `noxctl` command that hits an RPC honors the env var.

## SDK (Node)

`fetch` doesn't natively support SOCKS5. Pair the SDK with an undici dispatcher or a fetch wrapper:

```ts
import { Agent, setGlobalDispatcher } from "undici";
import { socksDispatcher } from "fetch-socks";
import { Nox } from "@nonos/nox-staking-sdk";

setGlobalDispatcher(socksDispatcher({ type: 5, host: "127.0.0.1", port: 1080 }));

const nox  = Nox.mainnet();
const live = nox.connect("https://eth-mainnet.example/v2/<KEY>");
await live.staking.stats();   // goes through SOCKS5
```

## SDK (browser)

The browser controls its own egress. Use Tor Browser, or route the page itself through a Nym browser exit.

## What anonymity buys

The RPC provider sees the SOCKS5 exit IP, not yours. With Nym, the exit IP is one of the mixnet exits and your traffic is uncorrelatable. With Tor, you get standard onion routing.

What it doesn't buy: anonymity for whatever you sign on-chain. If you broadcast a transaction from `0xYourAddress`, that address is forever linked to the action.
