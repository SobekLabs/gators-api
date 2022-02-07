import Cors from "cors";
import PixelGators from "../../contracts/abis/PixelGators.json";
import { ethers } from "ethers";
import axios from "axios";
import axiosRetry from 'axios-retry';


export default async function handler(req:any, res:any) {
  try {
    // Ignore .json extension
    const id = req.query.id.replace(/\D+/g, "");

    await Cors(req);

    axiosRetry(axios, { retries: 3 });
    // Web3 stuff

    const web3 = new ethers.providers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_NETWORK_RPC
    );

    if(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS == undefined || process.env.METADATA_URL == undefined){
      
      res.status(404).json({
        message: "Pixel Gator not found",
      });
      
      return;
    }


    
    const pixelGatorsUrl = await axios.get(process.env.METADATA_URL);

    // Loading FantomMunks abi
    const contract = new ethers.Contract(
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
      PixelGators,
      web3
    );

    const tokenId = pixelGatorsUrl.data.find((val:any) => val.tokenId == id);

    if(tokenId == undefined){
      res.status(404).json({
        message: "Pixel Gator not found",
      });
      
      return;
    }

        
    // Check if munk has owner
    await contract
      .ownerOf(id)
      .then(async (resp:any) => {
        // Fetch the munk metadata
        const jsonBody = await axios.get(tokenId.path.replace("ipfs://","https://cloudflare-ipfs.com/ipfs/"));
        res.status(200).json(jsonBody.data);
      })
      .catch((err: any) => {
        res.status(404).json({
          error: err,
          message: "Pixel Gator not found yet",
        });
      });
  } catch (error) {
    res.status(500).json({ error });
  }
}