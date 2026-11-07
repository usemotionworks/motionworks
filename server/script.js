import mongoose from "mongoose";
import dotenv from "dotenv";
import {
  getSpotifyAccessToken,
} from "./services/presave/spotifyTokenService.js";


dotenv.config();


const guestId = "b79b04cf692ec4c1ce984b5079f6f4bb9f5c0fe7ada010345d8452350606f3ea";
mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("MongoDB connected");


  try {

    console.log("Successfully dropped the old broken UPC index!");
  } catch (error) {
    console.log("Index drop info:", error.message);
  }

  // Start background backup processing only after MongoDB connects.

});


const accessToken = await getSpotifyAccessToken(guestId);

console.log("Access token retrieved:", Boolean(accessToken));
