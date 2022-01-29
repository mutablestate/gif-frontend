<script>
  import { onMount } from 'svelte';
  import { Buffer } from 'buffer';
  window.Buffer = Buffer;

  import Toast from './lib/Toast.svelte';
  import { notifications } from './lib/notificationStore';
  import { walletAddress, currentStatus } from './stores';
  import { shortenAddress } from './utils';

  import * as solanaWeb3 from '@solana/web3.js';
  import * as anchorWeb3 from '@project-serum/anchor';

  import kp from './keypair.json';
  import idl from './idl.json';

  // SystemProgram is a reference to the Solana runtime!
  const { SystemProgram, Connection, PublicKey, clusterApiUrl } = solanaWeb3;
  const { Program, Provider, web3 } = anchorWeb3;

  const arr = Object.values(kp._keypair.secretKey);
  const secret = new Uint8Array(arr);
  const baseAccount = web3.Keypair.fromSecretKey(secret);

  const programID = new PublicKey(idl.metadata.address);
  const network = clusterApiUrl('devnet');

  // Controls how we want to acknowledge when a transaction is "done".
  const opts = {
    preflightCommitment: 'processed'
  };

  let solana;
  let inputValue;
  let gifList = [];

  async function getGifList() {
    console.log('Fetching GIF list...');
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(
        baseAccount.publicKey
      );
      console.log('Got the account', account);
      return account?.gifList || null;
    } catch (error) {
      console.log('Error in getGifList: ', error);
      return null;
    }
  }

  async function handleSubmitLink() {
    if (inputValue.length === 0) {
      console.log('Empty input. Try again.');
      return;
    }
    console.log('Gif link:', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey
        }
      });
      console.log('GIF successfully sent to program', inputValue);

      const gifs = await getGifList();
      gifList = gifs;

      inputValue = '';
    } catch (error) {
      console.log('Error sending GIF:', error);
    }
  }

  async function connectTrustedWallet() {
    if (solana?.isPhantom) {
      const response = await solana.connect({ onlyIfTrusted: true });
      notifications.success('👻 Reconnected wallet! 👻 ', 3000);
      console.log(
        'Connected with Public Key:',
        shortenAddress(response.publicKey.toString())
      );
      currentStatus.set(shortenAddress(response.publicKey.toString()));
      walletAddress.set(response.publicKey.toString());
    } else {
      notifications.danger(
        'Solana object not found! Get a Phantom Wallet 👻',
        3000
      );
    }
  }

  async function handleConnectWallet() {
    if (solana?.isPhantom) {
      console.log('solana.connect');
      const response = await solana.connect();
      notifications.success(
        `Connected with Public Key: ${shortenAddress(
          response.publicKey.toString()
        )}`
      );
      console.log(
        'Connected with Public Key:',
        shortenAddress(response.publicKey.toString())
      );
      currentStatus.set(shortenAddress(response.publicKey.toString()));
      walletAddress.set(response.publicKey.toString());
    } else {
      notifications.danger(
        'Solana object not found! Get a Phantom Wallet 👻',
        3000
      );
    }
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
      console.log('ping');
      await program.rpc.initialize({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        },
        signers: [baseAccount]
      });
      notifications.info('Created a new BaseAccount!', 3000);
      console.log(
        'Created a new BaseAccount w/ address:',
        baseAccount.publicKey.toString()
      );
      const gifs = await getGifList();
      gifList = gifs;
    } catch (error) {
      notifications.danger('Please approve the transaction 👻', 3000);
      console.log('Error creating BaseAccount account:', error);
    }
  }
  onMount(async () => {
    solana = window?.solana;
    if (solana) {
      connectTrustedWallet();
    } else {
      notifications.info(
        'Solana object not found! Get a Phantom Wallet 👻',
        3000
      );
    }
  });
</script>

<main>
  <div>
    <Toast />
    <div class="header-text">🖼️ Devnet GIF Gallery 🖼️</div>
    <div class="sub-text">✨ Monty Python Collection ✨</div>
    <div class="status">
      <span class="status-text gradient-text">
        🔗 Wallet: {$currentStatus} 🔗
      </span>
    </div>

    {#if !$walletAddress}
      <div style="text-align: center;">
        <button
          class="cta-button connect-button"
          on:click={handleConnectWallet}
        >
          Connect to Phantom
        </button>
      </div>
    {:else}
      <div style="text-align: center;">
        <form on:submit|preventDefault={handleSubmitLink}>
          <input
            type="text"
            placeholder="Submit gif link!"
            bind:value={inputValue}
          />
          <button type="submit" class="cta-button submit-button">
            Submit GIF Link
          </button>
        </form>
      </div>
      {#if !gifList}
        <div style="text-align: center;">
          <button class="cta-button connect-button" on:click={createGifAccount}>
            Create GIF Account
          </button>
        </div>
      {/if}
    {/if}
  </div>

  <div style="margin: 2rem; width: 90vw;">
    {#if gifList?.length > 0}
      <div class="gif-grid">
        {#each gifList as { gifLink }}
          <div class="gif-item">
            <img src={gifLink} alt={gifLink} />
          </div>
        {/each}
      </div>
    {/if}
  </div>
</main>
