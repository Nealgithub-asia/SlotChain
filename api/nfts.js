const express = require('express');
const { Client, TokenCreateTransaction, TokenType, TokenSupplyType, TokenMintTransaction } = require('@hashgraph/sdk'); // Corrected package name
const axios = require('axios');

const app = express();
app.use(express.json());

const client = Client.forTestnet();
client.setOperator(process.env.HEDERA_ACCOUNT_ID, process.env.HEDERA_PRIVATE_KEY);

// Create NFT
app.post('/mint', async (req, res) => {
  const { userId, metadata } = req.body;
  try {
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
    res.status(400).json({ error: error.message });
  }
});

module.exports = app;
