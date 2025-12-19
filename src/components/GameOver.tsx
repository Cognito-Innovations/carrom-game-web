import React, { useState } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { beginCell, Address, toNano, Cell } from '@ton/core';
import { uploadMetadataToIPFS } from '../utils/nft';
import './GameOver.css';

const tg = window.Telegram?.WebApp;

interface GameOverProps {
  tonAddress?: string;
  telegramUser?: any;
  onMintNFT?: () => void;
  player1Score: number;
  player2Score: number;
  player1Pieces: number;
  player2Pieces: number;
  onRestart: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({
  tonAddress,
  // telegramUser,
  onMintNFT,
  player1Score,
  player2Score,
  player1Pieces,
  player2Pieces,
  onRestart
}) => {
  let winner = '';
  let title = '';
  if (player1Score > player2Score) {
    winner = 'Player 1';
    title = 'You Win!';
  } else if (player2Score > player1Score) {
    winner = 'Player 2 (Computer)';
    title = 'Game Over';
  } else if (player1Pieces > player2Pieces) {
    winner = 'Player 1';
    title = 'You Win!';
  } else if (player2Pieces > player1Pieces) {
    winner = 'Player 2 (Computer)';
    title = 'Game Over';
  } else {
    winner = 'Tie';
    title = "It's a Tie!";
  }

  const [tonConnectUI] = useTonConnectUI();
  const [isMinting, setIsMinting] = useState(false);
  const [mintedLink, setMintedLink] = useState<string | null>(null);

  const imageURL = 'https://gateway.pinata.cloud/ipfs/bafybeigqctc4kdyde4op4mbrdgg63zc3inqdbjldsqjbdd7gf3nncfg32i';

  // Convert Uint8Array hash to base64url string
  const toBase64url = (hash: Uint8Array): string => {
    let binary = '';
    for (let i = 0; i < hash.length; i++) {
      binary += String.fromCharCode(hash[i]);
    }
    let base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const handleMint = async () => {
    // TODO: Re-enable user validation once integrating telegramUser data for personalized NFTs
    // if (!telegramUser || !telegramUser.first_name) {
    //   tg?.showAlert("Telegram user data not loaded yet. Please wait.");
    //   return;
    // }
    if (!tonAddress || winner !== 'Player 1' || isMinting) return;
    setIsMinting(true);
    setMintedLink(null);

    try {
      const metadata = {
        name: `Carrom Win NFT #${Date.now()}`,
        // TODO: Re-enable personalization with telegramUser.first_name for description
        // description: `Victory reward for ${telegramUser?.first_name}!`,
        description: 'Victory reward for winning Carrom!',
        // TODO: Re-enable personalization with telegramUser.photo_url for image
        // image: telegramUser?.photo_url || imageURL,
        image: imageURL,
        attributes: [{ trait_type: 'Score', value: player1Score }]
      };

      const metadataUrl = await uploadMetadataToIPFS(
        metadata,
        import.meta.env.VITE_PINATA_API_KEY as string,
        import.meta.env.VITE_PINATA_SECRET as string
      );

      const mintBody: Cell = beginCell()
        .storeUint(1, 32)
        .storeUint(0, 64)
        .storeStringTail(metadataUrl)
        .endCell();

      // Send transaction to deployed collection contract address
      const collectionAddress = Address.parse(import.meta.env.VITE_NFT_COLLECTION_ADDRESS);
      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 min expiry
        messages: [{
          address: collectionAddress.toString(),
          amount: toNano('0.05').toString(), // Gas fee (adjust for testnet)
          payload: mintBody.toBoc().toString('base64') // Encoded payload
        }]
      });

      const cell = Cell.fromBase64(result.boc);
      const msgHashBytes = cell.hash();
      const msgHash = toBase64url(msgHashBytes);
      const txLink = `https://testnet.tonviewer.com/transaction/${msgHash}`;

      tg?.showAlert('NFT Minted! It may take 30s to appear in the explorer.');
      setMintedLink(txLink);
      onMintNFT?.();
    } catch (error) {
      console.error('Mint failed:', error);
      tg?.showAlert('Mint failed. Try again.');
    } finally {
      setIsMinting(false);
    }
  };

  const getButtonText = () => {
    if (isMinting) return 'Minting...';
    // TODO: Re-enable user data check once integrating telegramUser for personalized NFTs
    // if (!telegramUser) return 'Loading User Data...';
    return 'Claim NFT Reward';
  };

  return (
    <div className="game-over-overlay">
      <div className="game-over-box">
        <h2>{title}</h2>
        <div className="final-scores">
          <div className="score-item">
            <h3>Player 1</h3>
            <p>Score: {player1Score}</p>
            <p>Pieces Collected: {player1Pieces}</p>
          </div>
          <div className="score-item">
            <h3>Player 2 (Computer)</h3>
            <p>Score: {player2Score}</p>
            <p>Pieces Collected: {player2Pieces}</p>
          </div>
        </div>
        <div className="winner">
          <h2>{winner === 'Tie' ? "It's a Tie!" : `${winner} Wins!`}</h2>
        </div>
        {winner === 'Player 1' && (
          <>
            {!mintedLink ? (
              <button
                className="restart-btn"
                onClick={handleMint}
                // TODO: Re-enable telegramUser check once integrating for personalized NFTs
                // disabled={isMinting || !telegramUser}
                disabled={isMinting}
                style={{ opacity: isMinting ? 0.6 : 1 }}
              >
                {getButtonText()}
              </button>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                <a href={mintedLink} target="_blank" rel="noopener noreferrer" className="restart-btn nft-link">
                  View Transaction (Wait ~30s)
                </a>
              </div>
            )}
          </>
        )}
        <button className="restart-btn" onClick={onRestart}>
          Play Again
        </button>
      </div>
    </div>
  );
};