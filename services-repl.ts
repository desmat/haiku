require("dotenv").config({ path: ".env.local" });
import { RedisStore } from "@desmat/redis-store";
import { Redis } from "@upstash/redis";
import moment from "moment";
import * as admin from "./services/admin";
import * as haikus from "./services/haikus";
import * as haikudles from "./services/haikudles";
import * as openai from "./services/openai";
import * as usage from "./services/usage";
import * as users from "./services/users";
import * as webhooks from "./services/webhooks";
import { User } from "./types/User";
import { delay } from "@desmat/utils";
import { Haiku, HaikuOptions } from "./types/Haiku";
import { createStore } from "./services/stores/redis";

const kv = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const store = createStore({
  // debug: true
});

// const user = { id: "repl-user", isInternal: true } as User;

(async function () {
  console.log("Store and services (admin, haikus, haikudles, openai, usage, users, webhooks) ready.");

  // const ids = await haikus.getHaikuIds({ count: 3 });
  // console.log(ids);

  // console.log("latest haiku", await store.haikus.find({ count: 1 }));

  // console.log("latest user", await store.user.find({ count: 1 }));

  // console.log("haiku stats", await haikus.getHaikuStats());

  // console.log("user stats", await users.getUserStats());

  /*
  const dates = [
    // "2024-09-14T10:00:22.390Z",
    // "2024-09-15T12:44:17.182Z",
    // "2024-09-16T10:00:24.391Z",
    // "2024-09-17T10:00:19.738Z",
    // "2024-09-18T10:00:29.687Z",
    // "2024-09-19T10:00:44.579Z",
    // "2024-09-20T10:00:52.949Z",
    // "2024-09-21T10:00:46.646Z",
    // "2024-09-22T10:00:23.588Z",
    // "2024-09-23T10:00:44.517Z",
    // "2024-09-24T10:00:45.904Z",
    // "2024-09-25T10:00:32.927Z",
    undefined,
  ];

  for (const d of dates) {
    const m = moment(d)
    const stats = {
      ...await haikus.getHaikuStats(m),
      ...await users.getUserStats(m),
    };

    console.error(`${d}, ${stats.users}, ${stats.admins}, ${stats.flaggedUsers}, ${stats.monthlyNewUsers}, ${stats.monthlyReturningUsers}, ${stats.avgMonthlyReturningUserSessions}, ${stats.monthlyActiveUsers}, ${stats.dailyNewUsers}, ${stats.dailyReturningUser}, ${stats.dailyActiveUsers}, ${stats.haikus}, ${stats.newHaikus1day}, ${stats.newHaikus30days}`);
    // console.error(`${d}, ${stats.monthlyNewUsers}, ${stats.monthlyReturningUsers}, ${stats.dailyNewUsers}, ${stats.dailyReturningUser},`);
    // console.error(`${d}, ${stats.haikus}, ${stats.newHaikus1day}, ${stats.newHaikus30days}`);
  }
  */

  // haikus.getHaikuStats(moment("2024-09-20T10:00:52.949Z")).then(console.log);


  // console.log("generated haiku", await openai.generateHaiku(user.id, "en", "testing"))

  // delay(1000);

  // console.log((await kv.zrange("haikus", 0, -1)));
  // console.log((await kv.scan(0, { match: "haiku:*", count: 2 })));
  
  // console.log(await redisStore.scan({ match: "haiku:*", count: 2 }));

  // console.log(await kv.json.get("haiku:005568c0", "$"));

  
  store.haikus.ids({ count: 10 }).then(console.log);
  store.haikus.ids({ scan: "*", count: 10 }).then(console.log);


  var prevLookupKeys = [
    [ 'haikuusers', '4a2d28ad' ],
    [ 'haikuusers:admin:true', '4a2d28ad' ],
    [ 'haikuusers', '4a2d28ad' ],
    [ 'haikuusers:internal:false', '4a2d28ad' ]
  ];
  var lookupKeys = [
    [ 'haikuusers', '4a2d28ad' ],
    [ 'haikuusers:admin:true', '4a2d28ad' ],
    [ 'haikuusers', '4a2d28ad' ],
    [ 'haikuusers:internal:true', '4a2d28ad' ]
  ];

})();
