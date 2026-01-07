import { Injectable, signal, inject } from '@angular/core';
import { CryptoAsset } from './currency.service';
import { TranslationService } from './translation.service';

declare var ethers: any;

export interface Chain {
  chainId: number;
  nameKey: string; // Translation key
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: CryptoAsset;
    decimals: number;
  };
  blockExplorerUrl: string;
}

export interface Token {
  symbol: CryptoAsset;
  address: string;
  decimals: number;
  chainId: number;
}

const SUPPORTED_CHAINS: Chain[] = [
  {
    chainId: 1,
    nameKey: 'ethereum_network',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_ID', // Placeholder
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    blockExplorerUrl: 'https://etherscan.io'
  },
  {
    chainId: 56,
    nameKey: 'bsc_network',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    nativeCurrency: { name: 'Binance Coin', symbol: 'BNB', decimals: 18 },
    blockExplorerUrl: 'https://bscscan.com'
  },
  {
    chainId: 999, // Placeholder for non-EVM chain
    nameKey: 'bitcoin_network',
    rpcUrl: '', // N/A
    nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
    blockExplorerUrl: 'https://www.blockchain.com/explorer'
  }
];

const SUPPORTED_TOKENS: Token[] = [
  // Ethereum Mainnet Tokens
  { symbol: 'ETH', address: 'NATIVE', decimals: 18, chainId: 1 },
  { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, chainId: 1 },
  { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, chainId: 1 },
  // Binance Smart Chain Tokens
  { symbol: 'BNB', address: 'NATIVE', decimals: 18, chainId: 56 },
  { symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18, chainId: 56 },
  // Bitcoin (Placeholder)
  { symbol: 'BTC', address: 'NATIVE', decimals: 8, chainId: 999 },
];

const ERC20_ABI = [
  "function transfer(address to, uint256 value) returns (bool)"
];

@Injectable({
  providedIn: 'root'
})
export class Web3Service {
  private translationService = inject(TranslationService);
  private t = this.translationService.translate;
  
  private provider = signal<any | null>(null);
  private signer = signal<any | null>(null);

  supportedChains = signal<Chain[]>(SUPPORTED_CHAINS);
  private supportedTokens = signal<Token[]>(SUPPORTED_TOKENS);

  constructor() {}

  getTokensForChain(chainId: number): Token[] {
    return this.supportedTokens().filter(token => token.chainId === chainId);
  }

  private getChainConfig(chainId: number): Chain | undefined {
    return this.supportedChains().find(chain => chain.chainId === chainId);
  }
  
  private getTokenConfig(symbol: CryptoAsset, chainId: number): Token | undefined {
    return this.supportedTokens().find(token => token.symbol === symbol && token.chainId === chainId);
  }

  private async connectWallet(): Promise<{success: boolean, error?: string}> {
    if (this.signer()) return { success: true };

    if (typeof (window as any).ethereum === 'undefined') {
      return { success: false, error: 'Carteira Web3 (ex: MetaMask) não detectada.' };
    }

    try {
      const web3Provider = new ethers.providers.Web3Provider((window as any).ethereum, 'any');
      await web3Provider.send("eth_requestAccounts", []);
      const web3Signer = web3Provider.getSigner();
      
      this.provider.set(web3Provider);
      this.signer.set(web3Signer);

      // Automatically detect if the current network is supported
      const network = await web3Provider.getNetwork();
      const isSupported = this.supportedChains().some(
        // We exclude our placeholder Bitcoin chain from this EVM check
        chain => chain.chainId !== 999 && chain.chainId === network.chainId
      );
      
      if (!isSupported) {
        const supportedNetworkNames = this.supportedChains()
            .filter(c => c.chainId !== 999) // Exclude BTC placeholder
            .map(c => this.t()(c.nameKey))
            .join(', ');
        const errorMsg = this.t()('unsupported_network_error', { networks: supportedNetworkNames });
        return { success: false, error: errorMsg };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message ?? 'Falha ao conectar a carteira.' };
    }
  }

  private async switchNetwork(chainId: number): Promise<{success: boolean, error?: string}> {
    const chainConfig = this.getChainConfig(chainId);
    if (!chainConfig) {
      return { success: false, error: 'Rede não suportada.' };
    }

    try {
      await this.provider().send('wallet_switchEthereumChain', [{ chainId: ethers.utils.hexValue(chainId) }]);
      return { success: true };
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        return this.addNetwork(chainConfig);
      }
      return { success: false, error: 'Falha ao trocar de rede. Por favor, troque manualmente em sua carteira.' };
    }
  }

  private async addNetwork(chainConfig: Chain): Promise<{success: boolean, error?: string}> {
     try {
        await this.provider().send('wallet_addEthereumChain', [{
          chainId: ethers.utils.hexValue(chainConfig.chainId),
          chainName: chainConfig.nativeCurrency.name,
          rpcUrls: [chainConfig.rpcUrl],
          nativeCurrency: chainConfig.nativeCurrency,
          blockExplorerUrls: [chainConfig.blockExplorerUrl]
        }]);
        return { success: true };
      } catch (addError: any) {
        return { success: false, error: 'Falha ao adicionar a rede à carteira.' };
      }
  }

  async sendPayment(
    chainId: number, 
    tokenSymbol: CryptoAsset, 
    amount: string, 
    recipientAddress: string
  ): Promise<{success: boolean, hash?: string, error?: string}> {

    // Guard against attempting to process native BTC transactions via ethers.js
    if (chainId === 999) {
      return { success: false, error: this.t()('btc_payment_not_supported') };
    }
    
    // 1. Connect Wallet
    const connectionResult = await this.connectWallet();
    if (!connectionResult.success) {
      return connectionResult;
    }

    // 2. Check and Switch Network
    const network = await this.provider().getNetwork();
    if (network.chainId !== chainId) {
      const switchResult = await this.switchNetwork(chainId);
      if (!switchResult.success) {
        return switchResult;
      }
    }

    // 3. Get Token/Transaction configuration
    const tokenConfig = this.getTokenConfig(tokenSymbol, chainId);
    if (!tokenConfig) {
        return { success: false, error: 'Configuração de token inválida.' };
    }
    
    try {
        let tx;
        if (tokenConfig.address === 'NATIVE') {
            // Native currency transfer (ETH, BNB)
            const txRequest = {
                to: recipientAddress,
                value: ethers.utils.parseUnits(amount, tokenConfig.decimals)
            };
            tx = await this.signer().sendTransaction(txRequest);
        } else {
            // ERC20 token transfer (USDT, WBTC)
            const tokenContract = new ethers.Contract(tokenConfig.address, ERC20_ABI, this.signer());
            const amountInSmallestUnit = ethers.utils.parseUnits(amount, tokenConfig.decimals);
            tx = await tokenContract.transfer(recipientAddress, amountInSmallestUnit);
        }

        // Optional: wait for transaction confirmation
        await tx.wait();

        return { success: true, hash: tx.hash };

    } catch (error: any) {
        console.error("Payment Error:", error);
        return { success: false, error: error?.reason ?? error?.message ?? 'A transação foi rejeitada ou falhou.' };
    }
  }
}