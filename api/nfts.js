const { Client, TokenCreateTransaction, TokenType, TokenSupplyType, TokenMintTransaction } = require('@hashgraph/sdk');
const axios = require('axios');
const cors = require('cors');

// This function will be the serverless handler
module.exports = async (req, res) => {
  // Apply CORS middleware
  const corsMiddleware = cors();
  await new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  if (req.method === 'POST' && req.url.includes('/mint')) {
    const { userId, metadata } = req.body;
    try {
      if (!process.env.HEDERA_ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY) {
          throw new Error("Hedera API credentials are not configured on the server.");
      }
      const client = Client.forTestnet();
      client.setOperator(process.env.HEDERA_ACCOUNT_ID, process.env.HEDERA_PRIVATE_KEY);

      // This part is a placeholder for generating an NFT image.
      // In a real application, you would use a service like ChainGPT as intended.
      const nftImage = "https://placehold.co/600x600/8b5cf6/FFFFFF/png?text=GroomingNFT";

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

      const mintTx = await new TokenMintTransaction()
        .setTokenId(tokenId)
        .addMetadata(Buffer.from(JSON.stringify({ ...metadata, image: nftImage })))
        .execute(client);
      const mintReceipt = await mintTx.getReceipt(client);

      res.json({ tokenId: tokenId.toString(), status: mintReceipt.status.toString() });
    } catch (error) {
      console.error("NFT Minting Error:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(404).json({ error: 'Route not found' });
  }
};
