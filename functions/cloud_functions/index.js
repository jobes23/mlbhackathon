const functions = require("firebase-functions");
const { fetchmlbdata } = require("./fetchmlbdata"); 
const { getarticles } = require("./fetcharticles");
const { fetchplayerstats } = require("./fetchplayerstats");
const { fetchteamstats } = require("./fetchteamstats");
const { fetchplayervideos } = require("./fetchplayervideos");
const { fetchteambets } = require("./fetchteambets");
const { fetchchallenge } = require("./fetchchallenge");
const { setchallengestatus } = require("./setchallengestatus");
const { fetchteamstatsgame } = require("./fetchteamstatsgame")
const { fetchteamschedule } = require("./fetchteamschedule")
const { fetchuserchallengesandrewards } = require("./fetchuserchallengesandrewards")
const { fetchtts } = require("./fetchtts");
const { setrewards } = require("./setrewards");
const { setupuser } = require("./setupuser");
const { syncuserchallenges } = require("./syncuserchallenges");
const { getfirebaseconfig } = require("./getfirebaseconfig")

exports.fetchmlbdata = functions.https.onRequest(fetchmlbdata);
exports.getarticles = functions.https.onRequest(getarticles);
exports.fetchplayerstats = functions.https.onRequest(fetchplayerstats);
exports.fetchteamstats = functions.https.onRequest(fetchteamstats);
exports.fetchteamstatsgame = functions.https.onRequest(fetchteamstatsgame);
exports.fetchplayervideos = functions.https.onRequest(fetchplayervideos);
exports.fetchteambets = functions.https.onRequest(fetchteambets);
exports.fetchchallenge = functions.https.onRequest(fetchchallenge);
exports.setchallengestatus = functions.https.onRequest(setchallengestatus);
exports.fetchteamschedule = functions.https.onRequest(fetchteamschedule);
exports.fetchuserchallengesandrewards = functions.https.onRequest(fetchuserchallengesandrewards);
exports.fetchtts = functions.https.onRequest(fetchtts);
exports.setrewards = functions.https.onRequest(setrewards);
exports.setupuser = functions.https.onRequest(setupuser);
exports.syncuserchallenges = functions.https.onRequest(syncuserchallenges);
exports.getfirebaseconfig = functions.https.onRequest(getfirebaseconfig)