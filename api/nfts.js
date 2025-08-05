const express = require('express');
const { Client, TokenCreateTransaction, TokenType, TokenSupplyType, TokenMintTransaction } = require('@hashgraph/sdk');
const axios = require('axios');
const cors = require('cors'); // Import cors

const app = express();

// --- Middleware Setup ---
app.use(cors());
app.use(express.json());

// Create NFT
app.post('/mint', async (req, res) => {
  const { userId, metadata } = req.body;
  try {
    if (!process.env.HEDERA_ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY) {
        throw new Error("Hedera API credentials are not configured on the server.");
    }
    const client = Client.forTestnet();
    client.setOperator(process.env.HEDERA_ACCOUNT_ID, process.env.HEDERA_PRIVATE_KEY);

    // Generate NFT with ChainGPT
    const nftResponse = await axios.post('https://api.chaingpt.org/nft/generate', {
      prompt: metadata.description,
      apiKey: process.env.CHAINGPT_API_KEY
    });
    const nftImage = nftResponse.data.imageUrl;

    // Create NFT on Hedera
    const tokenTx = await new TokenCreateTransaction()
      .setTokenName('GroomingNFT')
      .setTokenSymbol('GNFT')
      .setTokenType(TokenType.NonFungibleUnique)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(1)
      .setSupplyKey(client.operatorPublicKey)
      .setTreasuryAccountId(client.operatorAccountId)
      .execute(client);
    const tokenReceipt = await tokenTx.getReceipt(client);
    const tokenId = tokenReceipt.tokenId;

    // Mint NFT
    const mintTx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .addMetadata(Buffer.from(JSON.stringify({ ...metadata, image: nftImage })))
      .execute(client);
    const mintReceipt = await mintTx.getReceipt(client);

    // Store metadata on-chain
    await axios.post('https://testnet.mirrornode.hedera.com/api/v1/tokens/' + tokenId + '/nfts', {
      metadata: Buffer.from(JSON.stringify({ ...metadata, image: nftImage })).toString('base64')
    });

    res.json({ tokenId: tokenId.toString(), status: mintReceipt.status.toString() });
  } catch (error) {
    console.error("NFT Minting Error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
