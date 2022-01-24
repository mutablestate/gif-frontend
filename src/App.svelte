<script>
  import { onMount } from "svelte";
  import { Buffer } from "buffer";
  window.Buffer = Buffer;

  import { walletAddress } from "./stores";

  import * as solanaWeb3 from "@solana/web3.js";
  import * as anchorWeb3 from "@project-serum/anchor";

  import kp from "./keypair.json";
  import idl from "./idl.json";
  // SystemProgram is a reference to the Solana runtime!
  const { SystemProgram } = solanaWeb3;
  const { Connection, PublicKey, clusterApiUrl } = solanaWeb3;
  const { Program, Provider, web3 } = anchorWeb3;

  const arr = Object.values(kp._keypair.secretKey);
  const secret = new Uint8Array(arr);
  const baseAccount = web3.Keypair.fromSecretKey(secret);

  // Get our program's id from the IDL file.
  const programID = new PublicKey(idl.metadata.address);

  // Set our network to devnet.
  const network = clusterApiUrl("devnet");

  // Controls how we want to acknowledge when a transaction is "done".
  const opts = {
    preflightCommitment: "processed",
  };

  const TEST_GIFS = [
    "https://media.giphy.com/media/RI4LTRjrVJhTskGtrb/giphy.webp",
    "https://media.giphy.com/media/KhgowdbbeG0LK/giphy.webp",
    "https://media.giphy.com/media/UFzjusdrC1EOc/giphy.webp",
    "https://media.giphy.com/media/qu1GssFpndjDq/giphy.webp",
    "https://media.giphy.com/media/3s976LBmflJ17QqV7M/giphy.webp",
    "https://media.giphy.com/media/qwRD72MbIOWdy/giphy.webp",
  ];

  let solana;
  let inputValue;
  let gifList = [];
  $: console.log("gifList", gifList);

  async function getGifList() {
    console.log("Fetching GIF list...");
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(
        baseAccount.publicKey
      );
      console.log("Got the account", account);
      return account?.gifList || null;
    } catch (error) {
      console.log("Error in getGifList: ", error);
      return null;
    }
  }

  async function handleSubmitLink() {
    if (inputValue.length === 0) {
      console.log("Empty input. Try again.");
      return;
    }
    console.log("Gif link:", inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF successfully sent to program", inputValue);

      const gifs = await getGifList();
      gifList = gifs;

      inputValue = "";
    } catch (error) {
      console.log("Error sending GIF:", error);
    }
  }

  async function connectPhantom() {
    const response = await solana.connect({ onlyIfTrusted: true });
    console.log("Connected with Public Key:", response.publicKey.toString());
    walletAddress.set(response.publicKey.toString());
  }

  function getProvider() {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection,
      window.solana,
      opts.preflightCommitment
    );
    return provider;
  }

  async function createGifAccount() {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping");
      await program.rpc.initialize({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount],
      });
      console.log(
        "Created a new BaseAccount w/ address:",
        baseAccount.publicKey.toString()
      );
      const gifs = await getGifList();
      gifList = gifs;
    } catch (error) {
      console.log("Error creating BaseAccount account:", error);
    }
  }
  onMount(async () => {
    solana = window?.solana;
    if (solana?.isPhantom) {
      console.log("Phantom wallet found!");
    } else {
      console.log("Solana object not found! Get a Phantom Wallet 👻");
    }
  });
</script>

<main>
  <div class="container">
    <div class={$walletAddress ? "authed-container" : "container"}>
      <div class="header-container">
        <p class="header">🖼 Monty Python GIF Portal</p>
        <p class="sub-text">View your Monty GIF collection ✨</p>
      </div>
      {#if !$walletAddress}
        <button
          class="cta-button connect-wallet-button"
          on:click={connectPhantom}
        >
          Connect to Wallet
        </button>
      {:else}
        <div class="connected-container">
          <form on:submit|preventDefault={handleSubmitLink}>
            <input
              type="text"
              placeholder="Enter gif link!"
              bind:value={inputValue}
            />
            <button type="submit" class="cta-button submit-gif-button"
              >Submit</button
            >
          </form>

          {#if gifList?.length > 0}
            <div class="gif-grid">
              {#each gifList as { gifLink }}
                <div class="gif-item">
                  <img src={gifLink} alt={gifLink} />
                </div>
              {/each}
            </div>
          {:else}
            <div class="connected-container">
              <button
                class="cta-button submit-gif-button"
                on:click={createGifAccount}
              >
                Do One-Time Initialization For GIF Program Account
              </button>
            </div>
          {/if}
        </div>
      {/if}
      <div class="footer-container" />
    </div>
  </div>
</main>
